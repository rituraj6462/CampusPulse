import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/team.service';
import { CreateTeamSchema, JoinTeamRequestSchema, JoinRequestStatus } from '@campuspulse/shared';

export class TeamController {
  static async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CreateTeamSchema.parse(req.body);
      const team = await TeamService.createTeam(validated, req.user!.id);
      return res.status(201).json({
        success: true,
        message: 'Team successfully created! You are the team leader.',
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamsForEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId;
      const teams = await TeamService.getTeamsForEvent(eventId, req.user?.id);
      return res.status(200).json({
        success: true,
        data: teams
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestToJoin(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = req.params.id;
      const validated = JoinTeamRequestSchema.parse(req.body);
      const request = await TeamService.requestToJoinTeam(teamId, validated, req.user!.id);
      return res.status(201).json({
        success: true,
        message: 'Join request sent to team leader!',
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  static async respondToRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = req.params.id;
      const requestId = req.params.requestId;
      const { status } = req.body;

      if (status !== JoinRequestStatus.ACCEPTED && status !== JoinRequestStatus.REJECTED) {
        return res.status(400).json({ success: false, error: 'Status must be ACCEPTED or REJECTED.' });
      }

      const result = await TeamService.respondToJoinRequest(teamId, requestId, status, req.user!.id);
      return res.status(200).json({
        success: true,
        message: `Request ${status.toLowerCase()} successfully.`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async leaveTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = req.params.id;
      const result = await TeamService.leaveTeam(teamId, req.user!.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
