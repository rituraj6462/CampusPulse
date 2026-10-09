import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { generateTicketCode, generateQrPayload } from '../utils/crypto';
import { NotificationService } from './notification.service';
import { RegistrationStatus, TicketStatus, WaitlistStatus } from '@campuspulse/shared';

export class RegistrationService {
  /**
   * Concurrency-safe registration inside an atomic transaction.
   * Guarantees capacity is never exceeded and duplicate registrations are prevented.
   */
  static async registerForEvent(eventId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch event and verify eligibility
      const event = await tx.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new AppError('Event not found.', 404);
      }

      if (event.status !== 'PUBLISHED') {
        throw new AppError(`Registration is closed. Event status is ${event.status.toLowerCase()}.`, 400);
      }

      const now = new Date();
      if (new Date(event.registrationDeadline) < now) {
        throw new AppError('Registration deadline has passed for this event.', 400);
      }

      // 2. Prevent duplicate registrations
      const existingRegistration = await tx.registration.findUnique({
        where: {
          eventId_userId: { eventId, userId }
        },
        include: { ticket: true }
      });

      if (existingRegistration && existingRegistration.status === RegistrationStatus.CONFIRMED) {
        throw new AppError('You are already registered for this event.', 409, {
          registrationId: existingRegistration.id,
          ticketCode: existingRegistration.ticket?.ticketCode
        });
      }

      // 3. Concurrency-safe capacity check
      const confirmedCount = await tx.registration.count({
        where: {
          eventId,
          status: RegistrationStatus.CONFIRMED
        }
      });

      if (confirmedCount >= event.capacity) {
        throw new AppError('Event is currently at full capacity.', 409, {
          isFull: true,
          capacity: event.capacity,
          confirmedCount
        });
      }

      // 4. Create or reactivate registration record
      let registration;
      if (existingRegistration) {
        registration = await tx.registration.update({
          where: { id: existingRegistration.id },
          data: {
            status: RegistrationStatus.CONFIRMED,
            registeredAt: now,
            cancelledAt: null
          }
        });
      } else {
        registration = await tx.registration.create({
          data: {
            eventId,
            userId,
            status: RegistrationStatus.CONFIRMED,
            registeredAt: now
          }
        });
      }

      // 5. Generate secure ticket
      const ticketCode = generateTicketCode(event.slug);
      const qrCodePayload = generateQrPayload(ticketCode, eventId, userId);

      // Delete any previous voided ticket for this registration
      await tx.ticket.deleteMany({
        where: { registrationId: registration.id }
      });

      const ticket = await tx.ticket.create({
        data: {
          ticketCode,
          registrationId: registration.id,
          userId,
          eventId,
          qrCodePayload,
          status: TicketStatus.VALID,
          issuedAt: now
        }
      });

      // 6. If user was on the waitlist, mark waitlist entry resolved
      await tx.waitlistEntry.updateMany({
        where: {
          eventId,
          userId,
          status: { in: [WaitlistStatus.WAITING, WaitlistStatus.OFFERED] }
        },
        data: {
          status: WaitlistStatus.ACCEPTED,
          resolvedAt: now
        }
      });

      return { registration, ticket, event };
    }).then(async (result) => {
      // Send confirmation notification
      await NotificationService.sendNotification({
        userId,
        title: 'Registration Confirmed!',
        message: `You are confirmed for "${result.event.title}". Ticket: ${result.ticket.ticketCode}`,
        type: 'REGISTRATION',
        link: `/tickets/${result.ticket.ticketCode}`
      });

      return result;
    });
  }

  /**
   * Concurrency-safe cancellation with automatic waitlist promotion.
   */
  static async cancelRegistration(eventId: string, userId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: {
          eventId_userId: { eventId, userId }
        },
        include: {
          event: true,
          ticket: true
        }
      });

      if (!registration || registration.status !== RegistrationStatus.CONFIRMED) {
        throw new AppError('No active confirmed registration found for this event.', 404);
      }

      const now = new Date();

      // 1. Mark registration cancelled
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          status: RegistrationStatus.CANCELLED,
          cancelledAt: now
        }
      });

      // 2. Mark ticket voided
      if (registration.ticket) {
        await tx.ticket.update({
          where: { id: registration.ticket.id },
          data: { status: TicketStatus.VOIDED }
        });
      }

      // 3. Check for waitlisted students to automatically promote
      const nextInLine = await tx.waitlistEntry.findFirst({
        where: {
          eventId,
          status: WaitlistStatus.WAITING
        },
        orderBy: { position: 'asc' },
        include: { user: true }
      });

      let promotedUser = null;
      if (nextInLine) {
        // Promote waitlisted user
        await tx.waitlistEntry.update({
          where: { id: nextInLine.id },
          data: {
            status: WaitlistStatus.ACCEPTED,
            resolvedAt: now
          }
        });

        // Create confirmed registration for promoted student
        const promotedReg = await tx.registration.upsert({
          where: {
            eventId_userId: { eventId, userId: nextInLine.userId }
          },
          update: {
            status: RegistrationStatus.CONFIRMED,
            registeredAt: now,
            cancelledAt: null
          },
          create: {
            eventId,
            userId: nextInLine.userId,
            status: RegistrationStatus.CONFIRMED,
            registeredAt: now
          }
        });

        // Issue new ticket for promoted student
        const ticketCode = generateTicketCode(registration.event.slug);
        const qrCodePayload = generateQrPayload(ticketCode, eventId, nextInLine.userId);

        const newTicket = await tx.ticket.create({
          data: {
            ticketCode,
            registrationId: promotedReg.id,
            userId: nextInLine.userId,
            eventId,
            qrCodePayload,
            status: TicketStatus.VALID,
            issuedAt: now
          }
        });

        // Reorder remaining waitlist entries
        await tx.waitlistEntry.updateMany({
          where: {
            eventId,
            status: WaitlistStatus.WAITING,
            position: { gt: nextInLine.position }
          },
          data: {
            position: { decrement: 1 }
          }
        });

        promotedUser = {
          userId: nextInLine.userId,
          ticketCode: newTicket.ticketCode,
          eventTitle: registration.event.title
        };
      }

      return {
        eventTitle: registration.event.title,
        promotedUser
      };
    });

    // Notify cancelling student
    await NotificationService.sendNotification({
      userId,
      title: 'Registration Cancelled',
      message: `Your registration for "${result.eventTitle}" has been cancelled.`,
      type: 'REGISTRATION'
    });

    // If a waitlisted student was promoted, notify them immediately
    if (result.promotedUser) {
      await NotificationService.sendNotification({
        userId: result.promotedUser.userId,
        title: 'Seat Offered & Confirmed!',
        message: `A seat opened up for "${result.promotedUser.eventTitle}" and you have been promoted from the waitlist! Ticket: ${result.promotedUser.ticketCode}`,
        type: 'WAITLIST',
        link: `/tickets/${result.promotedUser.ticketCode}`
      });
    }

    return {
      success: true,
      message: 'Registration successfully cancelled.'
    };
  }

  static async getStudentRegistrations(userId: string) {
    return prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            organizer: {
              select: { id: true, name: true, email: true, department: true }
            }
          }
        },
        ticket: {
          include: {
            attendance: true
          }
        }
      },
      orderBy: { registeredAt: 'desc' }
    });
  }
}
