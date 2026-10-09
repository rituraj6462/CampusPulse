import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { NotificationService } from './notification.service';
import { CreateTeamInput, JoinTeamRequestInput, TeamStatus, JoinRequestStatus, RegistrationStatus } from '@campuspulse/shared';

export class TeamService {
  static calculateSkillMatch(studentSkills: string[], desiredSkills: string[]): number {
    if (desiredSkills.length === 0) return 100;
    const lowerStudent = studentSkills.map(s => s.toLowerCase());
    let matches = 0;
    for (const desired of desiredSkills) {
      if (lowerStudent.some(s => s.includes(desired.toLowerCase()) || desired.toLowerCase().includes(s))) {
        matches++;
      }
    }
    return Math.round((matches / desiredSkills.length) * 100);
  }

  static async createTeam(input: CreateTeamInput, leaderId: string) {
    // 1. Check if event exists and is a hackathon/competition
    const event = await prisma.event.findUnique({
      where: { id: input.eventId }
    });

    if (!event) {
      throw new AppError('Event not found.', 404);
    }

    if (!event.isHackathon) {
      throw new AppError('Team formation is only available for hackathons and team competitions.', 400);
    }

    // 2. Student must be registered for the event
    const registration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: input.eventId, userId: leaderId } }
    });

    if (!registration || registration.status !== RegistrationStatus.CONFIRMED) {
      throw new AppError('You must be registered for this event before creating a team.', 400);
    }

    // 3. User cannot already be in a team for this event
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId: leaderId,
        team: { eventId: input.eventId }
      }
    });

    if (existingMembership) {
      throw new AppError('You are already a member of a team for this hackathon.', 409);
    }

    // 4. Create team and add leader as first member
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          eventId: input.eventId,
          name: input.name,
          description: input.description,
          maxMembers: input.maxMembers,
          leaderId,
          desiredSkills: JSON.stringify(input.desiredSkills),
          offeredSkills: JSON.stringify(input.offeredSkills),
          status: TeamStatus.RECRUITING
        }
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: leaderId,
          role: 'LEADER'
        }
      });

      return team;
    });
  }

  static async getTeamsForEvent(eventId: string, currentUserId?: string) {
    const teams = await prisma.team.findMany({
      where: { eventId },
      include: {
        leader: {
          select: { id: true, name: true, email: true, department: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, department: true, avatar: true }
            }
          }
        },
        joinRequests: currentUserId ? {
          where: { userId: currentUserId }
        } : false
      },
      orderBy: { createdAt: 'desc' }
    });

    let userInterests: string[] = [];
    if (currentUserId) {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { interests: true }
      });
      userInterests = user?.interests.map(i => i.interest) || [];
    }

    return teams.map(team => {
      let desiredSkills: string[] = [];
      let offeredSkills: string[] = [];
      try {
        desiredSkills = JSON.parse(team.desiredSkills);
        offeredSkills = JSON.parse(team.offeredSkills);
      } catch {
        // default empty
      }

      const isMember = team.members.some(m => m.userId === currentUserId);
      const userRequest = team.joinRequests && team.joinRequests.length > 0 ? team.joinRequests[0] : null;
      const skillMatchPercentage = currentUserId
        ? this.calculateSkillMatch(userInterests, desiredSkills)
        : undefined;

      return {
        id: team.id,
        eventId: team.eventId,
        name: team.name,
        description: team.description,
        maxMembers: team.maxMembers,
        leaderId: team.leaderId,
        desiredSkills,
        offeredSkills,
        status: team.status as TeamStatus,
        createdAt: team.createdAt.toISOString(),
        leader: team.leader,
        members: team.members.map(m => ({
          id: m.id,
          teamId: m.teamId,
          userId: m.userId,
          role: m.role as 'LEADER' | 'MEMBER',
          joinedAt: m.joinedAt.toISOString(),
          user: m.user
        })),
        isUserMember: isMember,
        userRequestStatus: userRequest ? (userRequest.status as JoinRequestStatus) : null,
        skillMatchPercentage
      };
    });
  }

  static async requestToJoinTeam(teamId: string, input: JoinTeamRequestInput, userId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        event: true,
        members: true
      }
    });

    if (!team) {
      throw new AppError('Team not found.', 404);
    }

    // Must be registered for event
    const registration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: team.eventId, userId } }
    });

    if (!registration || registration.status !== RegistrationStatus.CONFIRMED) {
      throw new AppError('You must register for the hackathon before requesting to join a team.', 400);
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers || team.status === TeamStatus.FULL) {
      throw new AppError('This team is already at full capacity.', 400);
    }

    // Check if user is already a member of any team in this event
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: { eventId: team.eventId }
      }
    });

    if (existingMembership) {
      throw new AppError('You are already a member of a team for this hackathon.', 409);
    }

    // Create or update join request
    const request = await prisma.teamJoinRequest.upsert({
      where: { teamId_userId: { teamId, userId } },
      update: {
        message: input.message,
        skills: JSON.stringify(input.skills),
        status: JoinRequestStatus.PENDING,
        createdAt: new Date()
      },
      create: {
        teamId,
        userId,
        message: input.message,
        skills: JSON.stringify(input.skills),
        status: JoinRequestStatus.PENDING
      }
    });

    // Notify team leader
    await NotificationService.sendNotification({
      userId: team.leaderId,
      title: 'New Team Join Request',
      message: `A student requested to join your team "${team.name}"!`,
      type: 'TEAM',
      link: `/events/${team.event.slug}`
    });

    return request;
  }

  static async respondToJoinRequest(
    teamId: string,
    requestId: string,
    status: JoinRequestStatus.ACCEPTED | JoinRequestStatus.REJECTED,
    leaderId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({
        where: { id: teamId },
        include: { members: true, event: true }
      });

      if (!team) {
        throw new AppError('Team not found.', 404);
      }

      if (team.leaderId !== leaderId) {
        throw new AppError('Unauthorized. Only the team leader can manage join requests.', 403);
      }

      const request = await tx.teamJoinRequest.findUnique({
        where: { id: requestId }
      });

      if (!request || request.teamId !== teamId) {
        throw new AppError('Join request not found.', 404);
      }

      if (status === JoinRequestStatus.ACCEPTED) {
        // Enforce capacity
        if (team.members.length >= team.maxMembers) {
          throw new AppError('Team is already full.', 400);
        }

        // Add member
        await tx.teamMember.create({
          data: {
            teamId,
            userId: request.userId,
            role: 'MEMBER'
          }
        });

        // Update request status
        await tx.teamJoinRequest.update({
          where: { id: requestId },
          data: { status: JoinRequestStatus.ACCEPTED, respondedAt: new Date() }
        });

        // If team reached max members, update status to FULL
        if (team.members.length + 1 >= team.maxMembers) {
          await tx.team.update({
            where: { id: teamId },
            data: { status: TeamStatus.FULL }
          });
        }

        // Cancel other pending requests from this user in this event
        await tx.teamJoinRequest.updateMany({
          where: {
            userId: request.userId,
            team: { eventId: team.eventId },
            id: { not: requestId }
          },
          data: { status: JoinRequestStatus.REJECTED }
        });
      } else {
        await tx.teamJoinRequest.update({
          where: { id: requestId },
          data: { status: JoinRequestStatus.REJECTED, respondedAt: new Date() }
        });
      }

      return { request, team };
    }).then(async (result) => {
      // Notify requesting student
      await NotificationService.sendNotification({
        userId: result.request.userId,
        title: status === JoinRequestStatus.ACCEPTED ? 'Team Request Accepted!' : 'Team Request Declined',
        message: status === JoinRequestStatus.ACCEPTED
          ? `You were accepted into team "${result.team.name}" for "${result.team.event.title}"!`
          : `Your request to join "${result.team.name}" was declined.`,
        type: 'TEAM',
        link: `/events/${result.team.event.slug}`
      });

      return result;
    });
  }

  static async leaveTeam(teamId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const membership = await tx.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
        include: { team: true }
      });

      if (!membership) {
        throw new AppError('You are not a member of this team.', 404);
      }

      if (membership.role === 'LEADER') {
        throw new AppError('Team leaders cannot leave the team. You must disband or transfer leadership.', 400);
      }

      await tx.teamMember.delete({
        where: { id: membership.id }
      });

      // Reopen recruiting status if it was full
      if (membership.team.status === TeamStatus.FULL) {
        await tx.team.update({
          where: { id: teamId },
          data: { status: TeamStatus.RECRUITING }
        });
      }

      return { success: true, message: 'You have left the team.' };
    });
  }
}
