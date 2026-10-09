import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { BADGE_DETAILS, BadgeType } from '@campuspulse/shared';

export class PassportService {
  /**
   * Awards achievement badges strictly from verified attendance records.
   */
  static async evaluateAndAwardAchievements(userId: string, _latestEventId?: string) {
    const attendances = await prisma.attendance.findMany({
      where: { userId },
      include: {
        event: true
      }
    });

    const totalCount = attendances.length;
    const workshopsCount = attendances.filter(a => 
      a.event.category.toLowerCase().includes('workshop') || 
      a.event.title.toLowerCase().includes('workshop')
    ).length;
    const hackathonsCount = attendances.filter(a => a.event.isHackathon).length;
    const techCount = attendances.filter(a => 
      ['AI & Machine Learning', 'Web Development', 'Competitive Programming', 'Cybersecurity', 'Robotics & IoT']
        .some(cat => a.event.category.includes(cat) || a.event.title.toLowerCase().includes(cat.toLowerCase()))
    ).length;

    const existingBadges = await prisma.achievement.findMany({
      where: { userId },
      select: { badgeType: true }
    });
    const unlockedSet = new Set(existingBadges.map(b => b.badgeType));

    const awardsToGrant: { badgeType: BadgeType; title: string; description: string; icon: string }[] = [];

    if (totalCount >= BADGE_DETAILS[BadgeType.FIRST_PULSE].threshold && !unlockedSet.has(BadgeType.FIRST_PULSE)) {
      const b = BADGE_DETAILS[BadgeType.FIRST_PULSE];
      awardsToGrant.push({ badgeType: BadgeType.FIRST_PULSE, title: b.title, description: b.description, icon: b.icon });
    }

    if (workshopsCount >= BADGE_DETAILS[BadgeType.WORKSHOP_EXPLORER].threshold && !unlockedSet.has(BadgeType.WORKSHOP_EXPLORER)) {
      const b = BADGE_DETAILS[BadgeType.WORKSHOP_EXPLORER];
      awardsToGrant.push({ badgeType: BadgeType.WORKSHOP_EXPLORER, title: b.title, description: b.description, icon: b.icon });
    }

    if (hackathonsCount >= BADGE_DETAILS[BadgeType.HACKATHON_HERO].threshold && !unlockedSet.has(BadgeType.HACKATHON_HERO)) {
      const b = BADGE_DETAILS[BadgeType.HACKATHON_HERO];
      awardsToGrant.push({ badgeType: BadgeType.HACKATHON_HERO, title: b.title, description: b.description, icon: b.icon });
    }

    if (totalCount >= BADGE_DETAILS[BadgeType.CAMPUS_REGULAR].threshold && !unlockedSet.has(BadgeType.CAMPUS_REGULAR)) {
      const b = BADGE_DETAILS[BadgeType.CAMPUS_REGULAR];
      awardsToGrant.push({ badgeType: BadgeType.CAMPUS_REGULAR, title: b.title, description: b.description, icon: b.icon });
    }

    if (techCount >= BADGE_DETAILS[BadgeType.TECH_PIONEER].threshold && !unlockedSet.has(BadgeType.TECH_PIONEER)) {
      const b = BADGE_DETAILS[BadgeType.TECH_PIONEER];
      awardsToGrant.push({ badgeType: BadgeType.TECH_PIONEER, title: b.title, description: b.description, icon: b.icon });
    }

    for (const award of awardsToGrant) {
      await prisma.achievement.create({
        data: {
          userId,
          badgeType: award.badgeType,
          title: award.title,
          description: award.description,
          icon: award.icon
        }
      });
    }

    return awardsToGrant;
  }

  static async getPassportProfile(userId: string, requestingUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: true
      }
    });

    if (!user) {
      throw new AppError('User passport not found.', 404);
    }

    // Check privacy
    const isOwner = requestingUserId === userId;
    if (!isOwner && !user.isPassportPublic) {
      throw new AppError('This user has set their Campus Passport profile to private.', 403);
    }

    const attendances = await prisma.attendance.findMany({
      where: { userId },
      include: {
        event: true
      },
      orderBy: { checkedInAt: 'desc' }
    });

    const achievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    });

    const unlockedSet = new Set(achievements.map(a => a.badgeType));

    const totalCount = attendances.length;
    const workshopsCount = attendances.filter(a => 
      a.event.category.toLowerCase().includes('workshop') || 
      a.event.title.toLowerCase().includes('workshop')
    ).length;
    const hackathonsCount = attendances.filter(a => a.event.isHackathon).length;
    const techCount = attendances.filter(a => 
      ['AI & Machine Learning', 'Web Development', 'Competitive Programming', 'Cybersecurity', 'Robotics & IoT']
        .some(cat => a.event.category.includes(cat) || a.event.title.toLowerCase().includes(cat.toLowerCase()))
    ).length;

    const milestones = [
      {
        badgeType: BadgeType.FIRST_PULSE,
        title: BADGE_DETAILS[BadgeType.FIRST_PULSE].title,
        description: BADGE_DETAILS[BadgeType.FIRST_PULSE].description,
        current: Math.min(totalCount, 1),
        threshold: 1,
        unlocked: unlockedSet.has(BadgeType.FIRST_PULSE),
        progressPercentage: Math.min(100, Math.round((totalCount / 1) * 100))
      },
      {
        badgeType: BadgeType.WORKSHOP_EXPLORER,
        title: BADGE_DETAILS[BadgeType.WORKSHOP_EXPLORER].title,
        description: BADGE_DETAILS[BadgeType.WORKSHOP_EXPLORER].description,
        current: Math.min(workshopsCount, 3),
        threshold: 3,
        unlocked: unlockedSet.has(BadgeType.WORKSHOP_EXPLORER),
        progressPercentage: Math.min(100, Math.round((workshopsCount / 3) * 100))
      },
      {
        badgeType: BadgeType.HACKATHON_HERO,
        title: BADGE_DETAILS[BadgeType.HACKATHON_HERO].title,
        description: BADGE_DETAILS[BadgeType.HACKATHON_HERO].description,
        current: Math.min(hackathonsCount, 1),
        threshold: 1,
        unlocked: unlockedSet.has(BadgeType.HACKATHON_HERO),
        progressPercentage: Math.min(100, Math.round((hackathonsCount / 1) * 100))
      },
      {
        badgeType: BadgeType.CAMPUS_REGULAR,
        title: BADGE_DETAILS[BadgeType.CAMPUS_REGULAR].title,
        description: BADGE_DETAILS[BadgeType.CAMPUS_REGULAR].description,
        current: Math.min(totalCount, 5),
        threshold: 5,
        unlocked: unlockedSet.has(BadgeType.CAMPUS_REGULAR),
        progressPercentage: Math.min(100, Math.round((totalCount / 5) * 100))
      },
      {
        badgeType: BadgeType.TECH_PIONEER,
        title: BADGE_DETAILS[BadgeType.TECH_PIONEER].title,
        description: BADGE_DETAILS[BadgeType.TECH_PIONEER].description,
        current: Math.min(techCount, 3),
        threshold: 3,
        unlocked: unlockedSet.has(BadgeType.TECH_PIONEER),
        progressPercentage: Math.min(100, Math.round((techCount / 3) * 100))
      }
    ];

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        graduationYear: user.graduationYear,
        bio: user.bio,
        isPassportPublic: user.isPassportPublic,
        createdAt: user.createdAt.toISOString()
      },
      verifiedAttendanceCount: totalCount,
      achievements: achievements.map(a => ({
        id: a.id,
        userId: a.userId,
        badgeType: a.badgeType as BadgeType,
        title: a.title,
        description: a.description,
        icon: a.icon,
        unlockedAt: a.unlockedAt.toISOString()
      })),
      milestones,
      recentEvents: attendances.map(a => ({
        id: a.eventId,
        title: a.event.title,
        category: a.event.category,
        attendedAt: a.checkedInAt.toISOString(),
        venue: a.event.venue
      }))
    };
  }

  static async togglePassportPrivacy(userId: string, isPassportPublic: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isPassportPublic },
      select: { id: true, isPassportPublic: true }
    });
  }
}
