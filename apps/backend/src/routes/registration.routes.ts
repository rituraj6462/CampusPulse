import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const registrationRouter = Router();

registrationRouter.post('/events/:id/register', requireAuth, RegistrationController.register);
registrationRouter.post('/events/:id/cancel', requireAuth, RegistrationController.cancel);
registrationRouter.get('/registrations/my', requireAuth, RegistrationController.getMyRegistrations);
