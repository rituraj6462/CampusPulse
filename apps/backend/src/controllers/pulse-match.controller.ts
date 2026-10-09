import { Request, Response, NextFunction } from 'express';
import { PulseMatchService } from '../services/pulse-match.service';

export class PulseMatchController {
  static async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const recommendations = await PulseMatchService.getRecommendations(req.user!.id);
      return res.status(200).json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }
}
