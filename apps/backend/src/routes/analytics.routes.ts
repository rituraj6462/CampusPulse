import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { Role } from '@campuspulse/shared';

export const analyticsRouter = Router();

analyticsRouter.get('/organizer/analytics', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), AnalyticsController.getAnalytics);
analyticsRouter.get('/organizer/events/:id/participants', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), AnalyticsController.getEventParticipants);
analyticsRouter.get('/organizer/events/:id/export-csv', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), AnalyticsController.exportParticipantsCsv);
