import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { NotificationService } from './notification.service';
import { RegistrationStatus, WaitlistStatus } from '@campuspulse/shared';

export class WaitlistService {
  static async joinWaitlist(eventId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new AppError('Event not found.', 404);
      }

      if (event.status !== 'PUBLISHED') {
        throw new AppError('Event is not open for waitlist.', 400);
      }

      // Check if user already confirmed
      const confirmedReg = await tx.registration.findUnique({
        where: { eventId_userId: { eventId, userId } }
      });

      if (confirmedReg && confirmedReg.status === RegistrationStatus.CONFIRMED) {
        throw new AppError('You are already registered for this event.', 400);
      }

      // Check if user is already waiting
      const existingWaitlist = await tx.waitlistEntry.findUnique({
        where: { eventId_userId: { eventId, userId } }
      });

      if (existingWaitlist && existingWaitlist.status === WaitlistStatus.WAITING) {
        return {
          entry: existingWaitlist,
          event,
          message: `You are already on the waitlist at position #${existingWaitlist.position}.`
        };
      }

      // Calculate next position
      const waitingCount = await tx.waitlistEntry.count({
        where: {
          eventId,
          status: WaitlistStatus.WAITING
        }
      });

      const nextPosition = waitingCount + 1;

      const entry = await tx.waitlistEntry.upsert({
        where: {
          eventId_userId: { eventId, userId }
        },
        update: {
          status: WaitlistStatus.WAITING,
          position: nextPosition,
          joinedAt: new Date(),
          offeredAt: null,
          offerExpiresAt: null,
          resolvedAt: null
        },
        create: {
          eventId,
          userId,
          position: nextPosition,
          status: WaitlistStatus.WAITING
        }
      });

      return {
        entry,
        event,
        message: `Joined waitlist at position #${nextPosition}.`
      };
    }).then(async (result) => {
      await NotificationService.sendNotification({
        userId,
        title: 'Joined Event Waitlist',
        message: `You are #${result.entry.position} on the waitlist for "${result.event.title}". You will be notified automatically if a seat opens up!`,
        type: 'WAITLIST'
      });

      return result;
    });
  }

  static async leaveWaitlist(eventId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const entry = await tx.waitlistEntry.findUnique({
        where: { eventId_userId: { eventId, userId } }
      });

      if (!entry || entry.status !== WaitlistStatus.WAITING) {
        throw new AppError('No active waitlist entry found.', 404);
      }

      await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          status: WaitlistStatus.CANCELLED,
          resolvedAt: new Date()
        }
      });

      // Shift remaining positions down
      await tx.waitlistEntry.updateMany({
        where: {
          eventId,
          status: WaitlistStatus.WAITING,
          position: { gt: entry.position }
        },
        data: {
          position: { decrement: 1 }
        }
      });

      return { success: true, message: 'You have left the waitlist.' };
    });
  }

  static async getStudentWaitlist(userId: string) {
    return prisma.waitlistEntry.findMany({
      where: {
        userId,
        status: { in: [WaitlistStatus.WAITING, WaitlistStatus.OFFERED] }
      },
      include: {
        event: {
          include: {
            organizer: {
              select: { id: true, name: true, email: true, department: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });
  }

  static async getEventWaitlist(eventId: string) {
    return prisma.waitlistEntry.findMany({
      where: {
        eventId,
        status: WaitlistStatus.WAITING
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true, avatar: true }
        }
      },
      orderBy: { position: 'asc' }
    });
  }
}
