import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';

import { authRouter } from './routes/auth.routes';
import { eventRouter } from './routes/event.routes';
import { registrationRouter } from './routes/registration.routes';
import { waitlistRouter } from './routes/waitlist.routes';
import { ticketRouter } from './routes/ticket.routes';
import { teamRouter } from './routes/team.routes';
import { passportRouter } from './routes/passport.routes';
import { pulseMatchRouter } from './routes/pulse-match.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { notificationRouter } from './routes/notification.routes';

export const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers & cookies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Rate limiters for sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Health check endpoint
app.get('/api/health', (_req, expressRes) => {
  expressRes.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CampusPulse API',
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/events', eventRouter);
app.use('/api', registrationRouter);
app.use('/api', waitlistRouter);
app.use('/api', ticketRouter);
app.use('/api', teamRouter);
app.use('/api', passportRouter);
app.use('/api', pulseMatchRouter);
app.use('/api', analyticsRouter);
app.use('/api', notificationRouter);

// Centralized error handling
app.use(errorHandler);
