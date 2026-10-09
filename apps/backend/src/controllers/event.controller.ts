import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { generateIcsContent } from '../utils/ics';
import { CreateEventSchema, UpdateEventSchema, EventFilterSchema, Role } from '@campuspulse/shared';

export class EventController {
  static async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = EventFilterSchema.parse(req.query);
      const result = await EventService.getEvents(filters, req.user?.id);
      return res.status(200).json({
        success: true,
        data: result.events,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.getEventBySlugOrId(req.params.slug, req.user?.id);
      return res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await EventService.getCategories();
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCalendarIcs(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.getEventBySlugOrId(req.params.id);
      const ics = generateIcsContent({
        title: event.title,
        description: event.shortDescription + '\n\n' + event.description,
        location: event.venue + (event.address ? `, ${event.address}` : ''),
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate)
      });

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${event.slug}.ics"`);
      return res.send(ics);
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CreateEventSchema.parse(req.body);
      const event = await EventService.createEvent(validated, req.user!.id);
      return res.status(201).json({
        success: true,
        message: 'Event created and published successfully.',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = UpdateEventSchema.parse(req.body);
      const event = await EventService.updateEvent(req.params.id, validated, req.user!.id, req.user!.role);
      return res.status(200).json({
        success: true,
        message: 'Event updated successfully.',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.deleteEvent(req.params.id, req.user!.id, req.user!.role);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
