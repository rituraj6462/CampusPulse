import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/ticket.service';
import { TicketCheckInSchema, Role } from '@campuspulse/shared';

export class TicketController {
  static async getTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketCode = req.params.ticketCode;
      const ticket = await TicketService.getTicketByCode(ticketCode, req.user!.id, req.user!.role);
      return res.status(200).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketCode, eventId } = TicketCheckInSchema.parse(req.body);
      const result = await TicketService.checkInTicket(
        ticketCode,
        eventId,
        req.user!.id,
        req.user!.role
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAttendees(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const attendees = await TicketService.getEventAttendees(
        eventId,
        req.user!.id,
        req.user!.role
      );

      return res.status(200).json({
        success: true,
        data: attendees
      });
    } catch (error) {
      next(error);
    }
  }
}
