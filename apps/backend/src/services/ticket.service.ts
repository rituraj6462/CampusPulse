import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { PassportService } from './passport.service';
import { NotificationService } from './notification.service';
import { TicketStatus, RegistrationStatus, Role } from '@campuspulse/shared';

export class TicketService {
  static async getTicketByCode(ticketCode: string, currentUserId: string, userRole: Role) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        event: {
          include: {
            organizer: {
              select: { id: true, name: true, email: true, department: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true, department: true, graduationYear: true, avatar: true }
        },
        attendance: true,
        registration: true
      }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    // Access control:
    // Only the ticket owner, event organizer, or admin can view ticket details
    const isOwner = ticket.userId === currentUserId;
    const isOrganizer = ticket.event.organizerId === currentUserId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isOwner && !isOrganizer && !isAdmin) {
      throw new AppError('Unauthorized to view this ticket.', 403);
    }

    return ticket;
  }

  static async checkInTicket(ticketCode: string, eventId: string, scannerUserId: string, scannerRole: Role) {
    // 1. Authorize scanner
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new AppError('Event not found.', 404);
    }

    if (scannerRole !== Role.ADMIN && event.organizerId !== scannerUserId) {
      throw new AppError('Unauthorized. You are not an authorized organizer for this event.', 403);
    }

    // 2. Perform check-in transaction
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { ticketCode },
        include: {
          user: true,
          attendance: true,
          registration: true
        }
      });

      if (!ticket) {
        throw new AppError(`Invalid ticket code: "${ticketCode}".`, 404);
      }

      // Check if ticket is for this specific event
      if (ticket.eventId !== eventId) {
        throw new AppError('Invalid ticket: This ticket belongs to a different event.', 400);
      }

      // Check for voided ticket
      if (ticket.status === TicketStatus.VOIDED || ticket.registration?.status === RegistrationStatus.CANCELLED) {
        throw new AppError('This ticket is voided due to registration cancellation.', 400);
      }

      // Duplicate Check-In Protection
      if (ticket.status === TicketStatus.CHECKED_IN || ticket.attendance) {
        const checkedTime = ticket.attendance?.checkedInAt 
          ? new Date(ticket.attendance.checkedInAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : 'earlier';
        throw new AppError(
          `DUPLICATE SCAN WARNING: This ticket was already checked in at ${checkedTime}!`,
          409,
          {
            duplicate: true,
            checkedInAt: ticket.attendance?.checkedInAt,
            attendeeName: ticket.user.name,
            attendeeEmail: ticket.user.email
          }
        );
      }

      const now = new Date();

      // 3. Mark ticket checked in
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.CHECKED_IN }
      });

      // 4. Update registration status to ATTENDED
      await tx.registration.update({
        where: { id: ticket.registrationId },
        data: { status: RegistrationStatus.ATTENDED }
      });

      // 5. Create immutable attendance record
      const attendance = await tx.attendance.create({
        data: {
          ticketId: ticket.id,
          eventId,
          userId: ticket.userId,
          checkedInAt: now,
          checkedInBy: scannerUserId
        }
      });

      return {
        ticket: updatedTicket,
        attendance,
        attendee: {
          id: ticket.user.id,
          name: ticket.user.name,
          email: ticket.user.email,
          department: ticket.user.department
        },
        eventTitle: event.title
      };
    });

    // Award verified Passport achievements and badges asynchronously
    try {
      await PassportService.evaluateAndAwardAchievements(result.attendee.id, eventId);
    } catch (err) {
      console.error('Error evaluating passport achievements:', err);
    }

    // Send notification to attendee
    await NotificationService.sendNotification({
      userId: result.attendee.id,
      title: 'Check-in Verified!',
      message: `Your attendance for "${result.eventTitle}" was verified. Check your Campus Passport for new stamps!`,
      type: 'CHECK_IN',
      link: '/passport'
    });

    return {
      success: true,
      message: `Verified check-in for ${result.attendee.name}.`,
      attendee: result.attendee,
      checkedInAt: result.attendance.checkedInAt
    };
  }

  static async getEventAttendees(eventId: string, organizerId: string, userRole: Role) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new AppError('Event not found.', 404);
    }

    if (userRole !== Role.ADMIN && event.organizerId !== organizerId) {
      throw new AppError('Unauthorized to view participant check-ins.', 403);
    }

    return prisma.attendance.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true, graduationYear: true, avatar: true }
        },
        ticket: {
          select: { ticketCode: true, status: true }
        }
      },
      orderBy: { checkedInAt: 'desc' }
    });
  }
}
