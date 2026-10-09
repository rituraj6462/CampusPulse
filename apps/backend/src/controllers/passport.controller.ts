import { Request, Response, NextFunction } from 'express';
import { PassportService } from '../services/passport.service';

export class PassportController {
  static async getMyPassport(req: Request, res: Response, next: NextFunction) {
    try {
      const passport = await PassportService.getPassportProfile(req.user!.id, req.user!.id);
      return res.status(200).json({
        success: true,
        data: passport
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserPassport(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.userId;
      const passport = await PassportService.getPassportProfile(targetUserId, req.user?.id);
      return res.status(200).json({
        success: true,
        data: passport
      });
    } catch (error) {
      next(error);
    }
  }

  static async togglePrivacy(req: Request, res: Response, next: NextFunction) {
    try {
      const { isPassportPublic } = req.body;
      const updated = await PassportService.togglePassportPrivacy(req.user!.id, Boolean(isPassportPublic));
      return res.status(200).json({
        success: true,
        message: `Passport profile is now ${updated.isPassportPublic ? 'public' : 'private'}.`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
