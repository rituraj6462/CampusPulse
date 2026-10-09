import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.middleware';
import { Role } from '@campuspulse/shared';

export const eventRouter = Router();

eventRouter.get('/', optionalAuth, EventController.getEvents);
eventRouter.get('/categories', EventController.getCategories);
eventRouter.get('/:slug/calendar.ics', EventController.getCalendarIcs);
eventRouter.get('/:slug', optionalAuth, EventController.getEventBySlug);

// Organizer & Admin protected routes
eventRouter.post('/', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), EventController.createEvent);
eventRouter.put('/:id', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), EventController.updateEvent);
eventRouter.delete('/:id', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), EventController.deleteEvent);
