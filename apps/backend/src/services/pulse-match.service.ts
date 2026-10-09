import { prisma } from '../db/prisma';
import { EventService } from './event.service';
import { EventStatus, RegistrationStatus } from '@campuspulse/shared';

export class PulseMatchService {
  /**
   * Transparent, deterministic scoring engine matching student preferences to upcoming events.
   */
  static async getRecommendations(userId: string) {
    // 1. Fetch user's registered interests
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: true,
        registrations: {
          where: { status: RegistrationStatus.CONFIRMED },
          select: { eventId: true }
        }
      }
    });

    if (!user) {
      return [];
    }

    const registeredEventIds = new Set(user.registrations.map(r => r.eventId));
    const userInterests = user.interests.map(i => i.interest.toLowerCase());

    // 2. Fetch published, upcoming events
    const now = new Date();
    const upcomingEvents = await prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        registrationDeadline: { gt: now },
        id: { notIn: Array.from(registeredEventIds) }
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, department: true }
        },
        _count: {
          select: {
            registrations: { where: { status: RegistrationStatus.CONFIRMED } }
          }
        }
      }
    });

    // 3. Compute score and reasons for each event
    const scoredList = upcomingEvents.map(event => {
      let score = 0;
      const matchReasons: string[] = [];
      const matchingInterests: string[] = [];

      let tags: string[] = [];
      try {
        tags = JSON.parse(event.tags);
      } catch {
        tags = [];
      }

      const eventCategory = event.category.toLowerCase();
      const eventTagsLower = tags.map(t => t.toLowerCase());

      // Interest Match (up to 60 pts)
      for (const interest of userInterests) {
        if (eventCategory.includes(interest) || interest.includes(eventCategory)) {
          score += 40;
          matchingInterests.push(interest);
          matchReasons.push(`Category aligns directly with "${interest}" (+40 pts)`);
        } else if (eventTagsLower.some(t => t.includes(interest) || interest.includes(t))) {
          score += 25;
          matchingInterests.push(interest);
          matchReasons.push(`Event topic tags match "${interest}" (+25 pts)`);
        }
      }

      // Department Match (up to 15 pts)
      if (user.department && event.organizer.department && user.department.toLowerCase() === event.organizer.department.toLowerCase()) {
        score += 15;
        matchReasons.push(`Hosted by your department: ${user.department} (+15 pts)`);
      }

      // Recency / Imminent Event Bonus (up to 15 pts)
      const daysUntil = (new Date(event.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntil <= 7 && daysUntil >= 0) {
        score += 15;
        matchReasons.push(`Happening soon within ${Math.ceil(daysUntil)} days (+15 pts)`);
      } else if (daysUntil <= 14 && daysUntil > 7) {
        score += 8;
        matchReasons.push('Happening in the next two weeks (+8 pts)');
      }

      // Seat Availability Bonus (10 pts)
      const confirmedCount = event._count.registrations;
      const availableSeats = Math.max(0, event.capacity - confirmedCount);
      if (availableSeats > 5) {
        score += 10;
        matchReasons.push(`Seats actively available (${availableSeats} remaining) (+10 pts)`);
      }

      // Hackathon flag bonus if student interested in web/competitive/AI
      if (event.isHackathon && userInterests.some(i => i.includes('web') || i.includes('competitive') || i.includes('ai'))) {
        score += 20;
        matchReasons.push('Hackathon match for builder skillset (+20 pts)');
      }

      // Fallback base score for broad discovery
      if (score === 0) {
        score = 15;
        matchReasons.push('Campus event open to all university students');
      }

      return {
        event,
        score,
        matchReasons,
        matchingInterests: Array.from(new Set(matchingInterests)),
        availableSeats,
        confirmedCount,
        tags
      };
    });

    // 4. Sort descending by score
    scoredList.sort((a, b) => b.score - a.score);

    // Format top 10 recommendations
    return scoredList.slice(0, 10).map(item => ({
      event: {
        id: item.event.id,
        title: item.event.title,
        slug: item.event.slug,
        description: item.event.description,
        shortDescription: item.event.shortDescription,
        category: item.event.category,
        venue: item.event.venue,
        address: item.event.address,
        bannerUrl: item.event.bannerUrl,
        organizerId: item.event.organizerId,
        organizer: item.event.organizer,
        startDate: item.event.startDate.toISOString(),
        endDate: item.event.endDate.toISOString(),
        registrationDeadline: item.event.registrationDeadline.toISOString(),
        capacity: item.event.capacity,
        availableSeats: item.availableSeats,
        confirmedCount: item.confirmedCount,
        waitlistCount: 0,
        isHackathon: item.event.isHackathon,
        tags: item.tags,
        status: item.event.status as EventStatus,
        createdAt: item.event.createdAt.toISOString(),
        updatedAt: item.event.updatedAt.toISOString()
      },
      score: item.score,
      matchReasons: item.matchReasons,
      matchingInterests: item.matchingInterests
    }));
  }
}
