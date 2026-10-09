# CampusPulse — Full-Stack Campus Event Management Platform

> **"Find your crowd. Build your campus story."**  
> *Recruitment Task & Production Portfolio Project for ACM Student Chapter SRMIST*

---

## 🌟 Executive Summary & Project Purpose

**CampusPulse** is an independently engineered full-stack campus event management and student engagement platform built specifically for the **ACM Student Chapter SRMIST**. 

University campuses often suffer from fragmented event promotion, spreadsheet-based attendee rosters, overbooked workshops, disconnected hackathon teammate searches, and zero persistent verification of student participation. 

CampusPulse solves these problems as a unified, production-grade product with:
1. **Light Editorial Visual Identity & Dual-Theme System**: Warm ivory/off-white default light theme, deep charcoal/navy dark mode, restrained cobalt-blue accents, and modern typography.
2. **ACID Concurrency-Safe Event Registration**: Database transaction locking preventing race conditions or seat overbooking even under simultaneous requests.
3. **Smart Waitlist with Automatic Seat Promotion**: FIFO waitlist queue with instantaneous seat elevation and in-app notifications upon cancellations.
4. **Pulse Match**: A deterministic, transparent recommendation engine that scores campus events against student interests and provides clear point breakdowns.
5. **Team Up**: Hackathon and competition team builder with skill compatibility scoring, capacity enforcement, and leader application approvals.
6. **Campus Passport**: Cryptographically verified digital credential passport awarding attendance stamps and badges (First Pulse, Workshop Explorer, Hackathon Hero, etc.).
7. **QR Tickets & Check-In Desk**: Unique ticket identifiers, QR code generator, organizer-only scanner verification, and duplicate scan rejection with previous check-in timestamps.
8. **Organizer Analytics Command Center**: Real SQL aggregations for capacity utilization, 14-day velocity charts, participant rosters, and CSV exports.

---

## 🏛️ System Architecture & Request Flow

```mermaid
graph TD
    Client["Client Web App (React 18 + Vite + TypeScript)"]
    Theme["Theme System (Light / Dark Tokens)"]
    Client --> Theme

    subgraph Backend ["Node.js / Express Architecture"]
        Router["Express REST Routers (/api/*)"]
        Middleware["Auth & Rate Limiting & Validation (Zod)"]
        Controllers["Resource Controllers"]
        
        subgraph Services ["Business Rule Services"]
            AuthSvc["AuthService (bcrypt + JWT)"]
            RegSvc["RegistrationService (ACID Transactions)"]
            WaitSvc["WaitlistService (Queue Reordering)"]
            PulseSvc["PulseMatchService (Deterministic Scoring)"]
            TeamSvc["TeamService (Skill Compatibility)"]
            PassSvc["PassportService (Milestones & Badges)"]
            TicketSvc["TicketService (QR & Duplicate Check-in)"]
            AnalyticsSvc["AnalyticsService (SQL Aggregations)"]
        end
    end

    subgraph DataLayer ["Data & Storage Layer"]
        Prisma["Prisma ORM Client"]
        Database[("PostgreSQL / SQLite Engine")]
    end

    Client -->|HTTP / Cookies / JSON| Router
    Router --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> Database
```

---

## 🗄️ Database Schema & Relational Design

CampusPulse uses **Prisma ORM** with version-controlled relational models, cascading deletes, composite uniqueness constraints, and targeted indexes.

### Entity-Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ USER_INTEREST : has
    USER ||--o{ EVENT : organizes
    USER ||--o{ REGISTRATION : submits
    USER ||--o{ WAITLIST_ENTRY : enters
    USER ||--o{ TICKET : owns
    USER ||--o{ ATTENDANCE : attends
    USER ||--o{ TEAM_MEMBER : joins
    USER ||--o{ TEAM_JOIN_REQUEST : applies
    USER ||--o{ ACHIEVEMENT : unlocks
    USER ||--o{ NOTIFICATION : receives

    EVENT ||--o{ REGISTRATION : contains
    EVENT ||--o{ WAITLIST_ENTRY : queues
    EVENT ||--o{ TICKET : issues
    EVENT ||--o{ ATTENDANCE : logs
    EVENT ||--o{ TEAM : hosts
    EVENT ||--o{ EVENT_FEEDBACK : receives

    REGISTRATION ||--|| TICKET : generates
    TICKET ||--o| ATTENDANCE : verifies
    TEAM ||--o{ TEAM_MEMBER : includes
    TEAM ||--o{ TEAM_JOIN_REQUEST : reviews

    USER {
        string id PK
        string email UK
        string passwordHash
        string name
        string role
        string department
        int graduationYear
        boolean isPassportPublic
        datetime createdAt
    }

    EVENT {
        string id PK
        string title
        string slug UK
        string category
        string venue
        int capacity
        boolean isHackathon
        string status
        datetime startDate
        datetime endDate
        datetime registrationDeadline
    }

    REGISTRATION {
        string id PK
        string eventId FK
        string userId FK
        string status
        datetime registeredAt
        datetime cancelledAt
    }

    TICKET {
        string id PK
        string ticketCode UK
        string registrationId FK,UK
        string eventId FK
        string userId FK
        string status
        string qrCodePayload
        datetime issuedAt
    }

    ATTENDANCE {
        string id PK
        string ticketId FK,UK
        string eventId FK
        string userId FK
        datetime checkedInAt
        string checkedInBy
    }

    WAITLIST_ENTRY {
        string id PK
        string eventId FK
        string userId FK
        int position
        string status
        datetime joinedAt
    }

    TEAM {
        string id PK
        string eventId FK
        string name
        int maxMembers
        string leaderId FK
        string desiredSkills
        string offeredSkills
    }
```

### Relational Design Decisions:
1. **Separation of Users, Events, and Registrations**: Normalizes the many-to-many relationship between students and events into a first-class `Registration` entity that records lifecycle states (`CONFIRMED`, `CANCELLED`, `ATTENDED`).
2. **Decoupled Ticket and Attendance Entities**: A `Ticket` represents the issued pass, whereas `Attendance` represents the verified check-in event. By placing a unique constraint on `Attendance.ticketId`, the database inherently prevents duplicate scans at the schema level.
3. **Composite Uniqueness**:
   - `@@unique([eventId, userId])` on `Registration` prevents double booking.
   - `@@unique([eventId, userId])` on `WaitlistEntry` prevents queue stuffing.
   - `@@unique([teamId, userId])` on `TeamMember` prevents duplicate team enrollments.
   - `@@unique([userId, badgeType])` on `Achievement` prevents duplicate badges.

---

## ⚡ Concurrency & Registration Strategy

A critical engineering vulnerability in event platforms is the **Seat Race Condition**: if 2 or more students submit registration for the final remaining seat at the exact same millisecond, naive systems allow both to register, exceeding venue fire codes and capacity limits.

### How CampusPulse Solves This:
```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant API as Registration Service
    participant DB as Database Transaction

    Student->>API: POST /api/events/:id/register
    API->>DB: BEGIN Transaction
    DB->>DB: Fetch Event record & verify status === 'PUBLISHED'
    DB->>DB: Verify registration deadline > now()
    DB->>DB: Check duplicate registration: [eventId, userId]
    DB->>DB: Count confirmed registrations inside transaction
    alt Confirmed Count >= Event Capacity
        DB-->>API: ROLLBACK Transaction
        API-->>Student: 409 Conflict ("Event at full capacity. Join waitlist.")
    else Confirmed Count < Event Capacity
        DB->>DB: Insert Registration (status: CONFIRMED)
        DB->>DB: Generate Ticket (opaque code & HMAC signed QR payload)
        DB->>DB: Resolve any previous waitlist entry to ACCEPTED
        DB-->>API: COMMIT Transaction
        API-->>Student: 201 Created (Registration + Boarding Pass)
    end
```

### Automatic Waitlist Promotion Lifecycle:
1. When a registered student cancels their seat (`POST /api/events/:id/cancel`), an atomic transaction runs.
2. The registration is marked `CANCELLED` and their ticket is marked `VOIDED`.
3. The transaction queries the highest priority waitlisted student:  
   `ORDER BY position ASC LIMIT 1 WHERE status = 'WAITING'`.
4. If found:
   - The waitlisted entry is updated to `ACCEPTED`.
   - A confirmed `Registration` is created automatically for the waitlisted student.
   - A new `Ticket` is generated and issued.
   - The queue positions for remaining waiting students are decremented by 1.
   - An in-app notification is sent to the promoted student: *"A seat opened up and your registration has been confirmed!"*

---

## 🎨 Dual Theme System (Light Editorial & Dark Mode)

CampusPulse implements a first-class, accessible light and dark mode system:

| Token | Light Theme (Default) | Dark Theme |
| :--- | :--- | :--- |
| **Identity** | Warm Ivory & Editorial Card | Deep Charcoal & Navy |
| **Background** (`--cp-bg`) | `#FAF8F5` | `#0B0F17` |
| **Surface** (`--cp-surface`) | `#FFFFFF` | `#111827` |
| **Elevated** (`--cp-elevated`) | `#F5F1E8` | `#161F30` |
| **Borders** (`--cp-border`) | `#E6E0D4` | `#222E42` |
| **Typography** (`--cp-text`) | `#1B1917` (Dark charcoal) | `#F1F5F9` (Light platinum) |
| **Cobalt Accent** (`--cp-cobalt`) | `#1D4ED8` | `#3B82F6` |

- **Zero-FOUC**: Inline head script checks `localStorage.getItem('campuspulse-theme')` before DOM paint.
- **Accessible Toggle**: Sun/Moon toggle with ARIA labels in header navigation and mobile drawer.
- **System Preference**: Fallback to `window.matchMedia('(prefers-color-scheme: dark)')` if unconfigured.

---

## 🛠️ Technology Stack

- **Monorepo**: npm workspaces (`apps/frontend`, `apps/backend`, `packages/shared`).
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, `qrcode.react`.
- **Backend**: Node.js, Express, TypeScript, Zod, bcryptjs, jsonwebtoken, cookie-parser, helmet, express-rate-limit.
- **Database & ORM**: PostgreSQL / SQLite, Prisma ORM 5.x.
- **Testing**: Vitest, Supertest.

---

## 📁 Repository Structure

```
ACM/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # SQLite schema for instant local dev
│   │   │   ├── schema.postgresql.prisma  # PostgreSQL schema for cloud deployments
│   │   │   └── seed.ts                   # Realistic campus seed dataset
│   │   └── src/
│   │       ├── config/                   # Environment configuration
│   │       ├── db/                       # Prisma client singleton
│   │       ├── middleware/               # Auth, role guard, rate limit, error handler
│   │       ├── utils/                    # Crypto, HMAC QR signer, ICS generator
│   │       ├── services/                 # ACID business logic services
│   │       ├── controllers/              # REST HTTP handlers
│   │       ├── routes/                   # Express routers
│   │       ├── __tests__/                # Vitest & Supertest automated test suites
│   │       ├── app.ts                    # Express app configuration
│   │       └── server.ts                 # HTTP listener
│   └── frontend/
│       ├── src/
│       │   ├── components/               # Navbar, Footer, EventCard, ThemeToggle, NotificationDropdown
│       │   ├── context/                  # ThemeContext, AuthContext
│       │   ├── lib/                      # API client fetch wrapper
│       │   ├── pages/                    # Landing, Discovery, Details, Dashboard, Ticket, PulseMatch, TeamUp, Passport, Organizer
│       │   ├── App.tsx                   # Route hierarchy
│       │   └── main.tsx                  # Root mount
│       ├── index.html                    # Fonts and anti-FOUC theme script
│       ├── tailwind.config.js            # Design tokens
│       └── vite.config.ts                # API proxy & path aliases
├── packages/
│   └── shared/
│       └── src/
│           └── index.ts                  # Shared Enums, Interfaces, DTOs, Zod schemas
├── package.json                          # Root scripts & workspaces
└── README.md                             # Documentation
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Installation
Clone the repository and install all workspace dependencies:
```bash
npm install
```

### 3. Generate Database & Seed
Initialize the relational database and seed realistic demo accounts and SRMIST events:
```bash
npm run db:migrate
npm run db:seed
```

### 4. Run Development Servers
Run both frontend and backend concurrently with a single command:
```bash
npm run dev
```
- Frontend will be available at: **http://localhost:5173**
- Backend API will be available at: **http://localhost:5000**
- Health check: **http://localhost:5000/api/health**

---

## 🔑 Demo Test Accounts

The seed script creates the following realistic SRMIST university test accounts:

| Role | Email | Password | Preloaded Scenarios |
| :--- | :--- | :--- | :--- |
| **Student** (Rohan Sharma) | `student@srmist.edu.in` | `Student@123` | Registered for HackSRM, Waitlisted for AI Summit, 1 verified attendance stamp ("First Pulse" badge), Leader of "NeuralDevs" team |
| **Student 2** (Aarav Patel) | `aarav@srmist.edu.in` | `Student@123` | Registered for AI Summit, competitive programming enthusiast |
| **Student 3** (Ananya Iyer) | `ananya@srmist.edu.in` | `Student@123` | Registered for AI Summit, applicant to "NeuralDevs" hackathon team |
| **Organizer** (ACM Chapter Lead) | `organizer@srmist.edu.in` | `Organizer@123` | Full access to Organizer Command Center, QR Check-In Scanner, and CSV exports |
| **Admin** (Office of Student Affairs) | `admin@srmist.edu.in` | `Admin@123` | Platform-wide administrative authority |

*Note: The login page includes 1-click test filler buttons for immediate evaluator testing.*

---

## 🧪 Automated Test Suite & Execution Results

To execute the automated test suite covering authentication, concurrency, waitlist promotions, duplicate check-in rejection, and distinctive features:

```bash
npm test
```

### Actual Test Execution Output:
```
 ✓ apps/backend/src/__tests__/ticket.checkin.test.ts  (1 test)
 ✓ apps/backend/src/__tests__/cancellation.waitlist.test.ts  (1 test)
 ✓ apps/backend/src/__tests__/auth.test.ts  (5 tests)
 ✓ apps/backend/src/__tests__/features.test.ts  (4 tests)
 ✓ apps/backend/src/__tests__/registration.concurrency.test.ts  (4 tests)

 Test Files  5 passed (5)
      Tests  15 passed (15)
   Duration  6.11s
```

### Tested Scenarios:
1. `auth.test.ts`:
   - Valid credentials login with session cookie and token.
   - Invalid password rejection with 401.
   - Unauthenticated access rejection for protected endpoints.
   - Student account registration with university department and interests.
2. `registration.concurrency.test.ts`:
   - Normal registration with opaque QR ticket code generation.
   - Duplicate registration rejection with 409 Conflict.
   - Full capacity event rejection.
   - **Simultaneous Race Condition Simulation**: 3 concurrent requests competing for 1 seat; exactly 1 succeeds (201) and 2 are rejected (409), with database count strictly bounded at 1.
3. `cancellation.waitlist.test.ts`:
   - Ticket voiding on cancellation.
   - Atomic automatic waitlist promotion promoting waitlisted student to confirmed status.
   - Issuance of new valid ticket pass for the promoted peer.
4. `ticket.checkin.test.ts`:
   - Authorized check-in by event organizer.
   - Unauthorized scanner rejection (students cannot scan peers).
   - **Duplicate Scan Warning Rejection**: Repeated check-in attempts return 409 with original scan timestamp and attendee info.
5. `features.test.ts`:
   - Pulse Match explainable scoring.
   - Team Up hackathon roster formation and join requests.
   - Campus Passport verified attendance stamps and badge calculation.
   - Organizer analytics metrics and CSV participant export.

---

## 🚢 Deployment Guide

### Deploying with Managed PostgreSQL (e.g. Supabase, Neon, AWS RDS)
1. In `apps/backend/prisma/schema.prisma`, switch datasource provider to `"postgresql"`.
2. Configure your environment variable:
   ```env
   DATABASE_URL="postgresql://username:password@your-db-host:5432/campuspulse?sslmode=require"
   ```
3. Run migrations on your PostgreSQL database:
   ```bash
   npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
   ```

### Deploying Backend (Railway, Render, Fly.io)
- Root Directory: `apps/backend`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/server.js`
- Required Environment Variables: `PORT`, `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`.

### Deploying Frontend (Vercel, Netlify)
- Root Directory: `apps/frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Configure Environment Variable: `VITE_API_URL` pointing to the deployed backend URL.

---

## 🔮 Future Enhancements
- Web push notifications via Service Workers.
- Direct camera video stream integration for mobile QR scanning.
- Dynamic certificates of merit downloadable as verified PDFs.

---

*Engineered with architectural excellence for ACM Student Chapter SRMIST.*
