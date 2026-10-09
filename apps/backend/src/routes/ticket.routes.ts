import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { Role } from '@campuspulse/shared';

export const ticketRouter = Router();

ticketRouter.get('/tickets/:ticketCode', requireAuth, TicketController.getTicket);
ticketRouter.post('/tickets/check-in', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), TicketController.checkIn);
ticketRouter.get('/events/:id/attendees', requireAuth, requireRole(Role.ORGANIZER, Role.ADMIN), TicketController.getAttendees);
