import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { Role, RegistrationStatus, EventStatus } from '@campuspulse/shared';

export class AnalyticsService {
  static async getOrganizerAnalytics(organizerId: string, userRole: Role) {
    const eventFilter = userRole === Role.ADMIN ? {} : { organizerId };

    // 1. Fetch total events
    const events = await prisma.event.findMany({
      where: eventFilter,
      include: {
        _count: {
          select: {
            registrations: { where: { status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED] } } },
            attendances: true,
            waitlistEntries: { where: { status: 'WAITING' } }
          }
        }
      }
    });

    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.status === EventStatus.PUBLISHED).length;

    let totalCapacity = 0;
    let totalRegistrations = 0;
    let totalAttendees = 0;
    let totalWaitlist = 0;

    for (const event of events) {
      totalCapacity += event.capacity;
      totalRegistrations += event._count.registrations;
      totalAttendees += event._count.attendances;
      totalWaitlist += event._count.waitlistEntries;
    }

    const averageCapacityUtilization = totalCapacity > 0
      ? Math.round((totalRegistrations / totalCapacity) * 100)
      : 0;

    const overallAttendanceRate = totalRegistrations > 0
      ? Math.round((totalAttendees / totalRegistrations) * 100)
      : 0;

    // 2. Registration Trend over past 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const eventIds = events.map(e => e.id);
    const recentRegistrations = await prisma.registration.findMany({
      where: {
        eventId: { in: eventIds },
        registeredAt: { gte: fourteenDaysAgo }
      },
      select: { registeredAt: true }
    });

    // Group by YYYY-MM-DD
    const trendMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap[dateStr] = 0;
    }

    for (const reg of recentRegistrations) {
      const dateStr = reg.registeredAt.toISOString().split('T')[0];
      if (trendMap[dateStr] !== undefined) {
        trendMap[dateStr]++;
      }
    }

    const recentRegistrationsTrend = Object.entries(trendMap).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      count
    }));

    // 3. Category Breakdown
    const categoryMap: Record<string, { eventCount: number; registrationCount: number }> = {};
    for (const e of events) {
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = { eventCount: 0, registrationCount: 0 };
      }
      categoryMap[e.category].eventCount++;
      categoryMap[e.category].registrationCount += e._count.registrations;
    }

    const categoryBreakdown = Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      eventCount: stats.eventCount,
      registrationCount: stats.registrationCount
    }));

    return {
      totalEvents,
      publishedEvents,
      totalRegistrations,
      totalAttendees,
      averageCapacityUtilization,
      overallAttendanceRate,
      waitlistSizeTotal: totalWaitlist,
      recentRegistrationsTrend,
      categoryBreakdown
    };
  }

  static async getEventParticipants(
    eventId: string,
    organizerId: string,
    userRole: Role,
    filter?: { search?: string; status?: string }
  ) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new AppError('Event not found.', 404);
    }

    if (userRole !== Role.ADMIN && event.organizerId !== organizerId) {
      throw new AppError('Unauthorized to access participant records.', 403);
    }

    const where: any = { eventId };
    if (filter?.status) {
      where.status = filter.status;
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            graduationYear: true
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

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      return registrations.filter(r => 
        r.user.name.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q) ||
        (r.ticket?.ticketCode && r.ticket.ticketCode.toLowerCase().includes(q))
      );
    }

    return registrations;
  }

  static async exportParticipantsCsv(eventId: string, organizerId: string, userRole: Role): Promise<string> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new AppError('Event not found.', 404);
    }

    if (userRole !== Role.ADMIN && event.organizerId !== organizerId) {
      throw new AppError('Unauthorized to export participants.', 403);
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: true,
        ticket: {
          include: {
            attendance: true
          }
        }
      },
      orderBy: { registeredAt: 'asc' }
    });

    const headers = [
      'Registration ID',
      'Student Name',
      'Email',
      'Department',
      'Graduation Year',
      'Ticket Code',
      'Status',
      'Registered At',
      'Checked In',
      'Checked In At'
    ];

    const rows = registrations.map(r => [
      `"${r.id}"`,
      `"${r.user.name.replace(/"/g, '""')}"`,
      `"${r.user.email}"`,
      `"${r.user.department || 'N/A'}"`,
      `"${r.user.graduationYear || 'N/A'}"`,
      `"${r.ticket?.ticketCode || 'N/A'}"`,
      `"${r.status}"`,
      `"${r.registeredAt.toISOString()}"`,
      `"${r.ticket?.attendance ? 'YES' : 'NO'}"`,
      `"${r.ticket?.attendance?.checkedInAt.toISOString() || 'N/A'}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
