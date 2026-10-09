import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { Role } from '@campuspulse/shared';

export class AnalyticsController {
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await AnalyticsService.getOrganizerAnalytics(req.user!.id, req.user!.role);
      return res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventParticipants(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const { search, status } = req.query as { search?: string; status?: string };
      const participants = await AnalyticsService.getEventParticipants(
        eventId,
        req.user!.id,
        req.user!.role,
        { search, status }
      );

      return res.status(200).json({
        success: true,
        data: participants
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportParticipantsCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const csv = await AnalyticsService.exportParticipantsCsv(
        eventId,
        req.user!.id,
        req.user!.role
      );

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="participants-${eventId}.csv"`);
      return res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}
