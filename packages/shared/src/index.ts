import { z } from 'zod';

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

export enum Role {
  STUDENT = 'STUDENT',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN'
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FULL = 'FULL',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum RegistrationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED'
}

export enum WaitlistStatus {
  WAITING = 'WAITING',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum TicketStatus {
  VALID = 'VALID',
  CHECKED_IN = 'CHECKED_IN',
  VOIDED = 'VOIDED'
}

export enum TeamStatus {
  RECRUITING = 'RECRUITING',
  FULL = 'FULL',
  LOCKED = 'LOCKED'
}

export enum JoinRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum BadgeType {
  FIRST_PULSE = 'FIRST_PULSE',
  WORKSHOP_EXPLORER = 'WORKSHOP_EXPLORER',
  HACKATHON_HERO = 'HACKATHON_HERO',
  CAMPUS_REGULAR = 'CAMPUS_REGULAR',
  TECH_PIONEER = 'TECH_PIONEER'
}

export const CAMPUS_INTERESTS = [
  'AI & Machine Learning',
  'Web Development',
  'Competitive Programming',
  'Cybersecurity',
  'Robotics & IoT',
  'Entrepreneurship',
  'UI/UX Design',
  'Cultural & Arts',
  'Sports & Fitness',
  'Workshops & Seminars'
] as const;

export type CampusInterest = typeof CAMPUS_INTERESTS[number];

export const BADGE_DETAILS: Record<BadgeType, { title: string; description: string; icon: string; threshold: number }> = {
  [BadgeType.FIRST_PULSE]: {
    title: 'First Pulse',
    description: 'Attended your very first verified campus event',
    icon: 'Sparkles',
    threshold: 1
  },
  [BadgeType.WORKSHOP_EXPLORER]: {
    title: 'Workshop Explorer',
    description: 'Attended 3+ specialized academic or technical workshops',
    icon: 'Compass',
    threshold: 3
  },
  [BadgeType.HACKATHON_HERO]: {
    title: 'Hackathon Hero',
    description: 'Participated in a certified collegiate hackathon or buildathon',
    icon: 'Trophy',
    threshold: 1
  },
  [BadgeType.CAMPUS_REGULAR]: {
    title: 'Campus Regular',
    description: 'Consistently engaged across 5+ campus events',
    icon: 'Flame',
    threshold: 5
  },
  [BadgeType.TECH_PIONEER]: {
    title: 'Tech Pioneer',
    description: 'Attended 3+ cutting-edge technology & engineering conferences',
    icon: 'Cpu',
    threshold: 3
  }
};

// ==========================================
// DOMAIN MODELS & DTOs
// ==========================================

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  department?: string | null;
  graduationYear?: number | null;
  bio?: string | null;
  isPassportPublic?: boolean;
  createdAt: string;
}

export interface UserWithInterests extends UserSummary {
  interests: string[];
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  venue: string;
  address?: string | null;
  bannerUrl?: string | null;
  organizerId: string;
  organizer?: UserSummary;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  capacity: number;
  availableSeats: number;
  confirmedCount: number;
  waitlistCount: number;
  isHackathon: boolean;
  tags: string[];
  status: EventStatus;
  userRegistration?: {
    status: RegistrationStatus;
    ticketCode?: string;
    registeredAt: string;
  } | null;
  userWaitlist?: {
    position: number;
    status: WaitlistStatus;
    joinedAt: string;
    offerExpiresAt?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketItem {
  id: string;
  ticketCode: string;
  registrationId: string;
  eventId: string;
  userId: string;
  status: TicketStatus;
  issuedAt: string;
  qrCodePayload: string;
  event?: {
    title: string;
    venue: string;
    startDate: string;
    endDate: string;
    bannerUrl?: string | null;
  };
  user?: UserSummary;
  attendance?: {
    checkedInAt: string;
    checkedInBy: string;
  } | null;
}

export interface RegistrationItem {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt?: string | null;
  user?: UserSummary;
  event?: EventItem;
  ticket?: TicketItem | null;
}

export interface WaitlistEntryItem {
  id: string;
  eventId: string;
  userId: string;
  position: number;
  status: WaitlistStatus;
  joinedAt: string;
  offeredAt?: string | null;
  offerExpiresAt?: string | null;
  event?: EventItem;
}

export interface TeamMemberItem {
  id: string;
  teamId: string;
  userId: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string;
  user: UserSummary;
}

export interface TeamJoinRequestItem {
  id: string;
  teamId: string;
  userId: string;
  message?: string | null;
  skills: string[];
  status: JoinRequestStatus;
  createdAt: string;
  user: UserSummary;
}

export interface TeamItem {
  id: string;
  eventId: string;
  name: string;
  description: string;
  maxMembers: number;
  leaderId: string;
  desiredSkills: string[];
  offeredSkills: string[];
  status: TeamStatus;
  createdAt: string;
  leader: UserSummary;
  members: TeamMemberItem[];
  joinRequests?: TeamJoinRequestItem[];
  userRequestStatus?: JoinRequestStatus | null;
  isUserMember?: boolean;
  skillMatchPercentage?: number;
}

export interface AchievementItem {
  id: string;
  userId: string;
  badgeType: BadgeType;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface PassportProfile {
  user: UserSummary;
  verifiedAttendanceCount: number;
  achievements: AchievementItem[];
  milestones: {
    badgeType: BadgeType;
    title: string;
    description: string;
    current: number;
    threshold: number;
    unlocked: boolean;
    progressPercentage: number;
  }[];
  recentEvents: {
    id: string;
    title: string;
    category: string;
    attendedAt: string;
    venue: string;
  }[];
}

export interface PulseMatchRecommendation {
  event: EventItem;
  score: number;
  matchReasons: string[];
  matchingInterests: string[];
}

export interface OrganizerAnalyticsSummary {
  totalEvents: number;
  publishedEvents: number;
  totalRegistrations: number;
  totalAttendees: number;
  averageCapacityUtilization: number;
  overallAttendanceRate: number;
  waitlistSizeTotal: number;
  recentRegistrationsTrend: {
    date: string;
    count: number;
  }[];
  categoryBreakdown: {
    category: string;
    eventCount: number;
    registrationCount: number;
  }[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'REGISTRATION' | 'WAITLIST' | 'TEAM' | 'CHECK_IN' | 'ANNOUNCEMENT';
  read: boolean;
  link?: string | null;
  createdAt: string;
}

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

export const RegisterUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role).default(Role.STUDENT),
  department: z.string().optional(),
  graduationYear: z.number().int().min(2023).max(2032).optional(),
  bio: z.string().max(250).optional(),
  interests: z.array(z.string()).optional()
});

export const LoginUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  department: z.string().optional(),
  graduationYear: z.number().int().min(2023).max(2032).optional(),
  bio: z.string().max(250).optional(),
  interests: z.array(z.string()).optional(),
  isPassportPublic: z.boolean().optional()
});

export const CreateEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  shortDescription: z.string().min(10, 'Short description is required').max(200),
  description: z.string().min(20, 'Detailed description must be at least 20 characters'),
  category: z.string().min(2),
  venue: z.string().min(2, 'Venue is required'),
  address: z.string().optional(),
  bannerUrl: z.string().url('Must be a valid image URL').optional().or(z.literal('')),
  startDate: z.string().datetime({ message: 'Start date must be an ISO date string' }),
  endDate: z.string().datetime({ message: 'End date must be an ISO date string' }),
  registrationDeadline: z.string().datetime({ message: 'Registration deadline must be an ISO date string' }),
  capacity: z.number().int().positive('Capacity must be greater than 0'),
  isHackathon: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: z.nativeEnum(EventStatus).optional()
});

export const EventFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  venue: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  availableOnly: z.enum(['true', 'false']).optional(),
  hackathonOnly: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  sortBy: z.enum(['date', 'popularity', 'title']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export const CreateTeamSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  name: z.string().min(3, 'Team name must be at least 3 characters').max(50),
  description: z.string().min(10, 'Project description must be at least 10 characters').max(400),
  maxMembers: z.number().int().min(2).max(6).default(4),
  desiredSkills: z.array(z.string()).min(1, 'Please specify at least 1 desired skill'),
  offeredSkills: z.array(z.string()).min(1, 'Please list at least 1 offered skill')
});

export const JoinTeamRequestSchema = z.object({
  message: z.string().max(200).optional(),
  skills: z.array(z.string()).min(1, 'Please select or list at least 1 skill')
});

export const TicketCheckInSchema = z.object({
  ticketCode: z.string().min(5, 'Ticket code is required'),
  eventId: z.string().min(1, 'Event ID is required')
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginUserInput = z.infer<typeof LoginUserSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type EventFilterInput = z.infer<typeof EventFilterSchema>;
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type JoinTeamRequestInput = z.infer<typeof JoinTeamRequestSchema>;
export type TicketCheckInInput = z.infer<typeof TicketCheckInSchema>;

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
