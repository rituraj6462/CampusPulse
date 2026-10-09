import { Router } from 'express';
import { WaitlistController } from '../controllers/waitlist.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { Role } from '@campuspulse/shared';

export const waitlistRouter = Router();

waitlistRouter.post('/events/:id/waitlist/join', requireAuth, WaitlistController.join);
waitlistRouter.post('/events/:id/waitlist/leave', requireAuth, WaitlistController.leave);
waitlistRouter.get('/waitlist/my', requireAuth, WaitlistController.getMyWaitlist);
waitlistRouter.get('/events/:id/waitlist', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), WaitlistController.getEventWaitlist);
