import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { config } from '../config';
import { RegisterUserSchema, LoginUserSchema, UpdateProfileSchema } from '@campuspulse/shared';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = RegisterUserSchema.parse(req.body);
      const { user, token } = await AuthService.register(validated);

      res.cookie(config.cookieName, token, config.cookieOptions);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = LoginUserSchema.parse(req.body);
      const { user, token } = await AuthService.login(validated);

      res.cookie(config.cookieName, token, config.cookieOptions);
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie(config.cookieName);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated.' });
      }
      const user = await AuthService.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated.' });
      }
      const validated = UpdateProfileSchema.parse(req.body);
      const user = await AuthService.updateProfile(req.user.id, validated);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}
