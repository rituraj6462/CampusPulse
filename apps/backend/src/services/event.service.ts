import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { CreateEventInput, UpdateEventInput, EventFilterInput, EventStatus, RegistrationStatus, WaitlistStatus, Role } from '@campuspulse/shared';

export class EventService {
  static createSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${baseSlug}-${randomSuffix}`;
  }

  static async getEvents(filters: EventFilterInput, currentUserId?: string) {
    const {
      search,
      category,
      venue,
      status = EventStatus.PUBLISHED,
      availableOnly,
      hackathonOnly,
      page = 1,
      limit = 12,
      sortBy = 'date',
      sortOrder = 'asc'
    } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = { contains: category };
    }

    if (venue) {
      where.venue = { contains: venue };
    }

    if (hackathonOnly === 'true') {
      where.isHackathon = true;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { shortDescription: { contains: q } },
        { venue: { contains: q } }
      ];
    }

    // Determine orderBy
    let orderBy: any = { startDate: sortOrder };
    if (sortBy === 'title') {
      orderBy = { title: sortOrder };
    }

    const total = await prisma.event.count({ where });

    const rawEvents = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
            role: true
          }
        },
        _count: {
          select: {
            registrations: {
              where: { status: RegistrationStatus.CONFIRMED }
            },
            waitlistEntries: {
              where: { status: WaitlistStatus.WAITING }
            }
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Check user registration and waitlist states if user is logged in
    let userRegistrationsMap = new Map<string, any>();
    let userWaitlistsMap = new Map<string, any>();

    if (currentUserId) {
      const eventIds = rawEvents.map(e => e.id);
      const userRegs = await prisma.registration.findMany({
        where: {
          userId: currentUserId,
          eventId: { in: eventIds },
          status: RegistrationStatus.CONFIRMED
        },
        include: { ticket: true }
      });
      userRegs.forEach(r => userRegistrationsMap.set(r.eventId, r));

      const userWaitlists = await prisma.waitlistEntry.findMany({
        where: {
          userId: currentUserId,
          eventId: { in: eventIds },
          status: { in: [WaitlistStatus.WAITING, WaitlistStatus.OFFERED] }
        }
      });
      userWaitlists.forEach(w => userWaitlistsMap.set(w.eventId, w));
    }

    const formattedEvents = rawEvents.map(event => {
      const confirmedCount = event._count.registrations;
      const waitlistCount = event._count.waitlistEntries;
      const availableSeats = Math.max(0, event.capacity - confirmedCount);
      const userReg = userRegistrationsMap.get(event.id);
      const userWait = userWaitlistsMap.get(event.id);

      let tags: string[] = [];
      try {
        tags = JSON.parse(event.tags);
      } catch {
        tags = [];
      }

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        shortDescription: event.shortDescription,
        category: event.category,
        venue: event.venue,
        address: event.address,
        bannerUrl: event.bannerUrl,
        organizerId: event.organizerId,
        organizer: event.organizer,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        registrationDeadline: event.registrationDeadline.toISOString(),
        capacity: event.capacity,
        availableSeats,
        confirmedCount,
        waitlistCount,
        isHackathon: event.isHackathon,
        tags,
        status: event.status as EventStatus,
        userRegistration: userReg ? {
          status: userReg.status as RegistrationStatus,
          ticketCode: userReg.ticket?.ticketCode,
          registeredAt: userReg.registeredAt.toISOString()
        } : null,
        userWaitlist: userWait ? {
          position: userWait.position,
          status: userWait.status as WaitlistStatus,
          joinedAt: userWait.joinedAt.toISOString(),
          offerExpiresAt: userWait.offerExpiresAt?.toISOString() || null
        } : null,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString()
      };
    });

    const filtered = availableOnly === 'true'
      ? formattedEvents.filter(e => e.availableSeats > 0)
      : formattedEvents;

    return {
      events: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  }

  static async getEventBySlugOrId(identifier: string, currentUserId?: string) {
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { slug: identifier },
          { id: identifier }
        ]
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
            role: true
          }
        },
        _count: {
          select: {
            registrations: {
              where: { status: RegistrationStatus.CONFIRMED }
            },
            waitlistEntries: {
              where: { status: WaitlistStatus.WAITING }
            }
          }
        }
      }
    });

    if (!event) {
      throw new AppError('Event not found.', 404);
    }

    const confirmedCount = event._count.registrations;
    const waitlistCount = event._count.waitlistEntries;
    const availableSeats = Math.max(0, event.capacity - confirmedCount);

    let userRegistration = null;
    let userWaitlist = null;

    if (currentUserId) {
      const reg = await prisma.registration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: currentUserId } },
        include: { ticket: true }
      });
      if (reg && reg.status === RegistrationStatus.CONFIRMED) {
        userRegistration = {
          status: reg.status as RegistrationStatus,
          ticketCode: reg.ticket?.ticketCode,
          registeredAt: reg.registeredAt.toISOString()
        };
      }

      const wait = await prisma.waitlistEntry.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: currentUserId } }
      });
      if (wait && (wait.status === WaitlistStatus.WAITING || wait.status === WaitlistStatus.OFFERED)) {
        userWaitlist = {
          position: wait.position,
          status: wait.status as WaitlistStatus,
          joinedAt: wait.joinedAt.toISOString(),
          offerExpiresAt: wait.offerExpiresAt?.toISOString() || null
        };
      }
    }

    let tags: string[] = [];
    try {
      tags = JSON.parse(event.tags);
    } catch {
      tags = [];
    }

    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      shortDescription: event.shortDescription,
      category: event.category,
      venue: event.venue,
      address: event.address,
      bannerUrl: event.bannerUrl,
      organizerId: event.organizerId,
      organizer: event.organizer,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      registrationDeadline: event.registrationDeadline.toISOString(),
      capacity: event.capacity,
      availableSeats,
      confirmedCount,
      waitlistCount,
      isHackathon: event.isHackathon,
      tags,
      status: event.status as EventStatus,
      userRegistration,
      userWaitlist,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    };
  }

  static async createEvent(input: CreateEventInput, organizerId: string) {
    const slug = this.createSlug(input.title);

    const event = await prisma.event.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        shortDescription: input.shortDescription,
        category: input.category,
        venue: input.venue,
        address: input.address,
        bannerUrl: input.bannerUrl || null,
        organizerId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        registrationDeadline: new Date(input.registrationDeadline),
        capacity: input.capacity,
        isHackathon: input.isHackathon,
        tags: JSON.stringify(input.tags || []),
        status: EventStatus.PUBLISHED
      }
    });

    return this.getEventBySlugOrId(event.id, organizerId);
  }

  static async updateEvent(
    id: string,
    input: UpdateEventInput,
    userId: string,
    userRole: Role
  ) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Event not found.', 404);
    }

    // Role check: Organizer can only edit their own event; Admin can edit any
    if (userRole !== Role.ADMIN && existing.organizerId !== userId) {
      throw new AppError('Unauthorized. You can only manage your own events.', 403);
    }

    const data: any = {};
    if (input.title) data.title = input.title;
    if (input.description) data.description = input.description;
    if (input.shortDescription) data.shortDescription = input.shortDescription;
    if (input.category) data.category = input.category;
    if (input.venue) data.venue = input.venue;
    if (input.address !== undefined) data.address = input.address;
    if (input.bannerUrl !== undefined) data.bannerUrl = input.bannerUrl;
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);
    if (input.registrationDeadline) data.registrationDeadline = new Date(input.registrationDeadline);
    if (input.capacity) data.capacity = input.capacity;
    if (input.isHackathon !== undefined) data.isHackathon = input.isHackathon;
    if (input.status) data.status = input.status;
    if (input.tags) data.tags = JSON.stringify(input.tags);

    const updated = await prisma.event.update({
      where: { id },
      data
    });

    return this.getEventBySlugOrId(updated.id, userId);
  }

  static async deleteEvent(id: string, userId: string, userRole: Role) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Event not found.', 404);
    }

    if (userRole !== Role.ADMIN && existing.organizerId !== userId) {
      throw new AppError('Unauthorized. You can only delete your own events.', 403);
    }

    await prisma.event.delete({ where: { id } });
    return { success: true, message: 'Event successfully removed.' };
  }

  static async getCategories() {
    const categories = await prisma.event.groupBy({
      by: ['category'],
      _count: { id: true }
    });

    return categories.map(c => ({
      name: c.category,
      count: c._count.id
    }));
  }
}
