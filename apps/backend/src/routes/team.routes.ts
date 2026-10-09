import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

export const teamRouter = Router();

teamRouter.get('/events/:eventId/teams', optionalAuth, TeamController.getTeamsForEvent);
teamRouter.post('/teams', requireAuth, TeamController.createTeam);
teamRouter.post('/teams/:id/request', requireAuth, TeamController.requestToJoin);
teamRouter.post('/teams/:id/requests/:requestId/respond', requireAuth, TeamController.respondToRequest);
teamRouter.post('/teams/:id/leave', requireAuth, TeamController.leaveTeam);
