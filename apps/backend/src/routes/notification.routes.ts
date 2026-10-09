import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const notificationRouter = Router();

notificationRouter.get('/notifications', requireAuth, NotificationController.getNotifications);
notificationRouter.put('/notifications/:id/read', requireAuth, NotificationController.markRead);
notificationRouter.put('/notifications/read-all', requireAuth, NotificationController.markAllRead);
