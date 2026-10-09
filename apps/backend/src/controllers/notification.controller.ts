import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await NotificationService.getUserNotifications(req.user!.id);
      return res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await NotificationService.markAsRead(id, req.user!.id);
      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.'
      });
    } catch (error) {
      next(error);
    }
  }
}
