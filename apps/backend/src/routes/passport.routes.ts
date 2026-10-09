import { Router } from 'express';
import { PassportController } from '../controllers/passport.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

export const passportRouter = Router();

passportRouter.get('/passport/me', requireAuth, PassportController.getMyPassport);
passportRouter.get('/passport/user/:userId', optionalAuth, PassportController.getUserPassport);
passportRouter.put('/passport/privacy', requireAuth, PassportController.togglePrivacy);
