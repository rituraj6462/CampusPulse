import { Request, Response, NextFunction } from 'express';
import { WaitlistService } from '../services/waitlist.service';
import { Role } from '@campuspulse/shared';

export class WaitlistController {
  static async join(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const userId = req.user!.id;
      const result = await WaitlistService.joinWaitlist(eventId, userId);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.entry
      });
    } catch (error) {
      next(error);
    }
  }

  static async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const userId = req.user!.id;
      const result = await WaitlistService.leaveWaitlist(eventId, userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMyWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await WaitlistService.getStudentWaitlist(req.user!.id);
      return res.status(200).json({
        success: true,
        data: entries
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const entries = await WaitlistService.getEventWaitlist(eventId);
      return res.status(200).json({
        success: true,
        data: entries
      });
    } catch (error) {
      next(error);
    }
  }
}
