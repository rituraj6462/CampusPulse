import { Router } from 'express';
import { PulseMatchController } from '../controllers/pulse-match.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const pulseMatchRouter = Router();

pulseMatchRouter.get('/pulse-match/recommendations', requireAuth, PulseMatchController.getRecommendations);
