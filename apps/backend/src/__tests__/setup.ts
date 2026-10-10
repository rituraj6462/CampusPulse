import { beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';

// Ensure test environment variables are active
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

beforeAll(async () => {
  const studentPassword = await bcrypt.hash('Student@123', 8);
  const organizerPassword = await bcrypt.hash('Organizer@123', 8);

  // 1. Primary Student (Rohan Sharma)
  const student = await prisma.user.upsert({
    where: { email: 'student@srmist.edu.in' },
    update: {},
    create: {
      email: 'student@srmist.edu.in',
      passwordHash: studentPassword,
      name: 'Rohan Sharma',
      role: 'STUDENT',
      department: 'Computer Science & Engineering',
      graduationYear: 2026,
      bio: 'Full-stack builder passionate about open source and cloud systems.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isPassportPublic: true,
      interests: {
        create: [
          { interest: 'AI & Machine Learning' },
          { interest: 'Web Development' },
          { interest: 'Competitive Programming' }
        ]
      }
    }
  });

  // 2. Student 2 (Aarav Patel)
  await prisma.user.upsert({
    where: { email: 'aarav@srmist.edu.in' },
    update: {},
    create: {
      email: 'aarav@srmist.edu.in',
      passwordHash: studentPassword,
      name: 'Aarav Patel',
      role: 'STUDENT',
      department: 'Software Engineering',
      graduationYear: 2025,
      bio: 'Competitive coder and algorithms enthusiast.',
      interests: {
        create: [
          { interest: 'Competitive Programming' },
          { interest: 'Cybersecurity' }
        ]
      }
    }
  });

  // 3. Organizer (ACM Chapter Lead)
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@srmist.edu.in' },
    update: {},
    create: {
      email: 'organizer@srmist.edu.in',
      passwordHash: organizerPassword,
      name: 'ACM Chapter Lead',
      role: 'ORGANIZER',
      department: 'ACM Student Chapter',
      graduationYear: 2025,
      bio: 'Faculty advisor & organizer for ACM SRMIST student activities.'
    }
  });

  // 4. Published Event (AI Summit)
  await prisma.event.upsert({
    where: { slug: 'ai-summit-llms-autonomous-agents' },
    update: {},
    create: {
      title: 'AI Summit: LLMs, Autonomous Agents & Neural Systems',
      slug: 'ai-summit-llms-autonomous-agents',
      shortDescription: 'Deep dive into large models and agentic workflows.',
      description: 'Comprehensive technical summit exploring modern neural architectures.',
      category: 'AI & Machine Learning',
      venue: 'T.P. Ganesan Auditorium',
      organizerId: organizer.id,
      startDate: new Date(Date.now() + 86400000 * 5),
      endDate: new Date(Date.now() + 86400000 * 5 + 3600000 * 4),
      registrationDeadline: new Date(Date.now() + 86400000 * 4),
      capacity: 100,
      status: 'PUBLISHED'
    }
  });

  // 5. Hackathon Event (HackSRM) with Team
  const hackathon = await prisma.event.upsert({
    where: { slug: 'hacksrm-2026-flagship' },
    update: {},
    create: {
      title: 'HackSRM 2026: 36-Hour National Flagship Hackathon',
      slug: 'hacksrm-2026-flagship',
      shortDescription: 'Annual 36-hour hackathon for student developers across India.',
      description: 'Build breakthrough applications in AI, Web3, and Systems.',
      category: 'Hackathons & Competitions',
      isHackathon: true,
      venue: 'Tech Park Main Hall',
      organizerId: organizer.id,
      startDate: new Date(Date.now() + 86400000 * 10),
      endDate: new Date(Date.now() + 86400000 * 12),
      registrationDeadline: new Date(Date.now() + 86400000 * 8),
      capacity: 120,
      status: 'PUBLISHED'
    }
  });

  // Check team NeuralDevs
  const existingTeam = await prisma.team.findFirst({
    where: { eventId: hackathon.id, name: 'NeuralDevs' }
  });

  if (!existingTeam) {
    const team = await prisma.team.create({
      data: {
        eventId: hackathon.id,
        name: 'NeuralDevs',
        description: 'Building multi-agent autonomous system for campus accessibility.',
        maxMembers: 4,
        leaderId: student.id,
        desiredSkills: JSON.stringify(['AI & Machine Learning', 'Python', 'FastAPI']),
        offeredSkills: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS']),
        status: 'OPEN'
      }
    });

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: student.id,
        role: 'LEADER'
      }
    });
  }

  // 6. Past verified event for Rohan
  const pastEvent = await prisma.event.upsert({
    where: { slug: 'webcraft-past-masterclass' },
    update: {},
    create: {
      title: 'WebCraft Past Masterclass',
      slug: 'webcraft-past-masterclass',
      shortDescription: 'Past workshop for attendance history.',
      description: 'Foundational workshop completed last semester.',
      category: 'Workshops & Seminars',
      venue: 'Lab 2',
      organizerId: organizer.id,
      startDate: new Date(Date.now() - 86400000 * 14),
      endDate: new Date(Date.now() - 86400000 * 14 + 7200000),
      registrationDeadline: new Date(Date.now() - 86400000 * 16),
      capacity: 50,
      status: 'COMPLETED'
    }
  });

  const existingReg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: pastEvent.id, userId: student.id } }
  });

  if (!existingReg) {
    const pastReg = await prisma.registration.create({
      data: {
        eventId: pastEvent.id,
        userId: student.id,
        status: 'ATTENDED'
      }
    });

    const pastTicket = await prisma.ticket.create({
      data: {
        ticketCode: 'CP-PAST-TEST-TICKET',
        registrationId: pastReg.id,
        eventId: pastEvent.id,
        userId: student.id,
        status: 'CHECKED_IN',
        qrCodePayload: JSON.stringify({ ticketCode: 'CP-PAST-TEST-TICKET', eventId: pastEvent.id })
      }
    });

    await prisma.attendance.create({
      data: {
        ticketId: pastTicket.id,
        eventId: pastEvent.id,
        userId: student.id,
        checkedInAt: new Date(Date.now() - 86400000 * 14),
        checkedInBy: organizer.id
      }
    });

    await prisma.achievement.create({
      data: {
        userId: student.id,
        badgeType: 'FIRST_PULSE',
        title: 'First Pulse',
        description: 'Attended your first verified campus event',
        icon: 'Sparkles',
        unlockedAt: new Date(Date.now() - 86400000 * 14)
      }
    });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
