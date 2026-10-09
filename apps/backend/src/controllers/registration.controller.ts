import { Request, Response, NextFunction } from 'express';
import { RegistrationService } from '../services/registration.service';

export class RegistrationController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const userId = req.user!.id;
      const result = await RegistrationService.registerForEvent(eventId, userId);

      return res.status(201).json({
        success: true,
        message: 'Successfully registered for event! Your QR ticket is ready.',
        data: {
          registration: result.registration,
          ticket: result.ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const userId = req.user!.id;
      const result = await RegistrationService.cancelRegistration(eventId, userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMyRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const registrations = await RegistrationService.getStudentRegistrations(req.user!.id);
      return res.status(200).json({
        success: true,
        data: registrations
      });
    } catch (error) {
      next(error);
    }
  }
}
