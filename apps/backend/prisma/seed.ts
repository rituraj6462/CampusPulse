import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Clearing existing database tables...');
  await prisma.attendance.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.teamJoinRequest.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eventFeedback.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Creating demo users...');
  const studentPassword = await bcrypt.hash('Student@123', 10);
  const organizerPassword = await bcrypt.hash('Organizer@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // 1. Primary Student
  const student = await prisma.user.create({
    data: {
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

  // 2. Student 2 (Aarav)
  const student2 = await prisma.user.create({
    data: {
      email: 'aarav@srmist.edu.in',
      passwordHash: studentPassword,
      name: 'Aarav Patel',
      role: 'STUDENT',
      department: 'Software Engineering',
      graduationYear: 2025,
      bio: 'Competitive coder and algorithms enthusiast.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      interests: {
        create: [
          { interest: 'Competitive Programming' },
          { interest: 'Cybersecurity' }
        ]
      }
    }
  });

  // 3. Student 3 (Ananya)
  const student3 = await prisma.user.create({
    data: {
      email: 'ananya@srmist.edu.in',
      passwordHash: studentPassword,
      name: 'Ananya Iyer',
      role: 'STUDENT',
      department: 'Information Technology',
      graduationYear: 2026,
      bio: 'UI/UX enthusiast and frontend developer.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      interests: {
        create: [
          { interest: 'UI/UX Design' },
          { interest: 'Web Development' }
        ]
      }
    }
  });

  // 4. Organizer (ACM Chapter Lead)
  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@srmist.edu.in',
      passwordHash: organizerPassword,
      name: 'SRMIST ACM Chapter Lead',
      role: 'ORGANIZER',
      department: 'ACM Student Chapter SRMIST',
      graduationYear: 2025,
      bio: 'Official event organizer for ACM Student Chapter SRMIST.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
    }
  });

  // 5. Administrator
  const admin = await prisma.user.create({
    data: {
      email: 'admin@srmist.edu.in',
      passwordHash: adminPassword,
      name: 'Campus Administrator',
      role: 'ADMIN',
      department: 'Office of Student Affairs',
      bio: 'System and platform administrator.'
    }
  });

  console.log('[Seed] Creating campus events...');
  const now = new Date();

  // Helper date adders
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  // Event 1: HackSRM 2026 (Hackathon, with Team Up)
  const eventHackathon = await prisma.event.create({
    data: {
      title: 'HackSRM 2026: 36-Hour National Flagship Hackathon',
      slug: 'hacksrm-2026-flagship',
      shortDescription: 'SRMIST flagship 36-hour hackathon bringing together 1,000+ collegiate innovators to solve real challenges.',
      description: 'HackSRM 2026 is the annual national flagship hackathon organized by ACM Student Chapter SRMIST. Experience 36 hours of non-stop building, industry mentorship from Google and Microsoft engineers, hardware labs, and prizes worth over INR 5,00,000.\n\nTracks include Generative AI, Web3 & FinTech, Healthcare IoT, and Open Innovation.',
      category: 'Hackathons & Competitions',
      venue: 'Dr. T.P. Ganesan Auditorium, SRMIST Main Campus',
      address: 'Kattankulathur, Chengalpattu, Tamil Nadu 603203',
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      organizerId: organizer.id,
      startDate: addDays(now, 5),
      endDate: addDays(now, 7),
      registrationDeadline: addDays(now, 4),
      capacity: 120,
      isHackathon: true,
      tags: JSON.stringify(['AI & Machine Learning', 'Web Development', 'Hackathon', 'SRMIST', 'Hardware']),
      status: 'PUBLISHED'
    }
  });

  // Event 2: WebCraft Next (Workshop, High Demand)
  const eventWorkshop = await prisma.event.create({
    data: {
      title: 'WebCraft Next: Modern Full-Stack Architecture with React & Node',
      slug: 'webcraft-next-fullstack-masterclass',
      shortDescription: 'Hands-on intensive masterclass on micro-frontends, edge caching, and scalable REST APIs.',
      description: 'Join ACM web leads for an in-depth dive into enterprise web application engineering. Learn modern design systems, atomic architecture, concurrency handling, and serverless deployment pipelines.',
      category: 'Workshops & Seminars',
      venue: 'Tech Park Auditorium, 7th Floor Lab',
      address: 'Tech Park, SRMIST Kattankulathur',
      bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      organizerId: organizer.id,
      startDate: addDays(now, 2),
      endDate: addDays(now, 2),
      registrationDeadline: addDays(now, 1),
      capacity: 45,
      isHackathon: false,
      tags: JSON.stringify(['Web Development', 'TypeScript', 'Node.js', 'React']),
      status: 'PUBLISHED'
    }
  });

  // Event 3: AI Summit (Low capacity of 2 to showcase WAITLIST & CONCURRENCY)
  const eventFullAi = await prisma.event.create({
    data: {
      title: 'AI Summit: LLMs, Autonomous Agents & Neural Systems',
      slug: 'ai-summit-llms-autonomous-agents',
      shortDescription: 'Exclusive closed-door summit on multi-agent frameworks, prompt routing, and vector databases.',
      description: 'An exclusive round-table and deep technical workshop on building production AI agents with Google DeepMind research insights, tool calling, and RAG pipelines.',
      category: 'AI & Machine Learning',
      venue: 'Mini Seminar Hall 1, Main Campus',
      address: 'University Building, SRMIST',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      organizerId: organizer.id,
      startDate: addDays(now, 3),
      endDate: addDays(now, 3),
      registrationDeadline: addDays(now, 2),
      capacity: 2, // Explicitly set to 2 so it is immediately at full capacity!
      isHackathon: false,
      tags: JSON.stringify(['AI & Machine Learning', 'Agents', 'Deep Learning']),
      status: 'PUBLISHED'
    }
  });

  // Event 4: Algorun 7.0 (Competitive Programming)
  const eventAlgo = await prisma.event.create({
    data: {
      title: 'Algorun 7.0: ACM ICPC Style Competitive Coding Sprint',
      slug: 'algorun-7-coding-sprint',
      shortDescription: 'Fast-paced algorithmic programming contest with prizes for top coders across batches.',
      description: 'Test your problem solving across graph algorithms, dynamic programming, and binary lifting in this 3-hour ICPC sprint hosted on Codeforces.',
      category: 'Competitive Programming',
      venue: 'UB Computing Labs 301-304',
      address: 'University Building 3rd Floor, SRMIST',
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      organizerId: organizer.id,
      startDate: addDays(now, 8),
      endDate: addDays(now, 8),
      registrationDeadline: addDays(now, 7),
      capacity: 100,
      isHackathon: false,
      tags: JSON.stringify(['Competitive Programming', 'C++', 'Data Structures']),
      status: 'PUBLISHED'
    }
  });

  // Event 5: CyberShield: CTF & Zero-Day Defense
  const eventCyber = await prisma.event.create({
    data: {
      title: 'CyberShield 2026: Capture The Flag & Offensive Security',
      slug: 'cybershield-2026-ctf',
      shortDescription: 'Jeopardy-style CTF challenge featuring reverse engineering, binary exploitation, and cryptography.',
      description: 'Organized by ACM Cybersecurity SIG. Solve live challenges across web exploitation, cryptography, digital forensics, and privilege escalation.',
      category: 'Cybersecurity',
      venue: 'Tech Park Hall 2',
      address: 'Tech Park, SRMIST',
      bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      organizerId: organizer.id,
      startDate: addDays(now, 12),
      endDate: addDays(now, 12),
      registrationDeadline: addDays(now, 11),
      capacity: 60,
      isHackathon: false,
      tags: JSON.stringify(['Cybersecurity', 'CTF', 'Forensics']),
      status: 'PUBLISHED'
    }
  });

  // Event 6: Past Completed Event (for Verified Attendance & Passport demonstration)
  const eventPast = await prisma.event.create({
    data: {
      title: 'ACM Induction & Open Source Keynote 2025',
      slug: 'acm-induction-keynote-2025',
      shortDescription: 'Annual recruitment and technical orientation session for ACM SRMIST Chapter.',
      description: 'Keynote introduction to open-source workflows, student chapters, and technical SIGs.',
      category: 'Workshops & Seminars',
      venue: 'Dr. T.P. Ganesan Main Hall',
      address: 'Main Campus, SRMIST',
      bannerUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
      organizerId: organizer.id,
      startDate: addDays(now, -10),
      endDate: addDays(now, -10),
      registrationDeadline: addDays(now, -12),
      capacity: 250,
      isHackathon: false,
      tags: JSON.stringify(['Workshops & Seminars', 'Open Source', 'Community']),
      status: 'COMPLETED'
    }
  });

  console.log('[Seed] Setting up registrations and tickets...');

  // 1. Register Rohan for HackSRM
  const rohanHackReg = await prisma.registration.create({
    data: {
      eventId: eventHackathon.id,
      userId: student.id,
      status: 'CONFIRMED',
      registeredAt: addDays(now, -2)
    }
  });

  const rohanHackTicket = await prisma.ticket.create({
    data: {
      ticketCode: 'CP-HACKSRM-8F4C2',
      registrationId: rohanHackReg.id,
      userId: student.id,
      eventId: eventHackathon.id,
      qrCodePayload: JSON.stringify({ tc: 'CP-HACKSRM-8F4C2', eid: eventHackathon.id, uid: student.id }),
      status: 'VALID',
      issuedAt: addDays(now, -2)
    }
  });

  // 2. Fill AI Summit (capacity: 2) with Student2 and Student3
  const reg1 = await prisma.registration.create({
    data: {
      eventId: eventFullAi.id,
      userId: student2.id,
      status: 'CONFIRMED'
    }
  });
  await prisma.ticket.create({
    data: {
      ticketCode: 'CP-AISUMM-AA11',
      registrationId: reg1.id,
      userId: student2.id,
      eventId: eventFullAi.id,
      qrCodePayload: JSON.stringify({ tc: 'CP-AISUMM-AA11', eid: eventFullAi.id, uid: student2.id }),
      status: 'VALID'
    }
  });

  const reg2 = await prisma.registration.create({
    data: {
      eventId: eventFullAi.id,
      userId: student3.id,
      status: 'CONFIRMED'
    }
  });
  await prisma.ticket.create({
    data: {
      ticketCode: 'CP-AISUMM-BB22',
      registrationId: reg2.id,
      userId: student3.id,
      eventId: eventFullAi.id,
      qrCodePayload: JSON.stringify({ tc: 'CP-AISUMM-BB22', eid: eventFullAi.id, uid: student3.id }),
      status: 'VALID'
    }
  });

  // 3. Put Rohan on Waitlist position #1 for AI Summit to showcase Waitlist UX!
  await prisma.waitlistEntry.create({
    data: {
      eventId: eventFullAi.id,
      userId: student.id,
      position: 1,
      status: 'WAITING',
      joinedAt: addDays(now, -1)
    }
  });

  // 4. Past event attendance for Rohan -> unlocks "First Pulse" badge!
  const rohanPastReg = await prisma.registration.create({
    data: {
      eventId: eventPast.id,
      userId: student.id,
      status: 'ATTENDED',
      registeredAt: addDays(now, -11)
    }
  });

  const rohanPastTicket = await prisma.ticket.create({
    data: {
      ticketCode: 'CP-ACMIND-9999',
      registrationId: rohanPastReg.id,
      userId: student.id,
      eventId: eventPast.id,
      qrCodePayload: JSON.stringify({ tc: 'CP-ACMIND-9999', eid: eventPast.id, uid: student.id }),
      status: 'CHECKED_IN',
      issuedAt: addDays(now, -11)
    }
  });

  await prisma.attendance.create({
    data: {
      ticketId: rohanPastTicket.id,
      eventId: eventPast.id,
      userId: student.id,
      checkedInAt: addDays(now, -10),
      checkedInBy: organizer.id
    }
  });

  // Unlocked badge for Rohan
  await prisma.achievement.create({
    data: {
      userId: student.id,
      badgeType: 'FIRST_PULSE',
      title: 'First Pulse',
      description: 'Attended your very first verified campus event',
      icon: 'Sparkles',
      unlockedAt: addDays(now, -10)
    }
  });

  console.log('[Seed] Setting up Team Up hackathon team...');
  // Create team "NeuralDevs" led by Rohan for HackSRM
  const hackTeam = await prisma.team.create({
    data: {
      eventId: eventHackathon.id,
      name: 'NeuralDevs',
      description: 'Building an autonomous agentic campus assistant for course planning and real-time room booking.',
      maxMembers: 4,
      leaderId: student.id,
      desiredSkills: JSON.stringify(['Python', 'PyTorch', 'UI/UX Design', 'FastAPI']),
      offeredSkills: JSON.stringify(['React', 'TypeScript', 'Prisma', 'Tailwind CSS']),
      status: 'RECRUITING'
    }
  });

  await prisma.teamMember.create({
    data: {
      teamId: hackTeam.id,
      userId: student.id,
      role: 'LEADER'
    }
  });

  // Ananya requests to join NeuralDevs
  await prisma.teamJoinRequest.create({
    data: {
      teamId: hackTeam.id,
      userId: student3.id,
      message: 'Hey Rohan! I am an IT student specializing in UI/UX and Figma prototyping. Would love to join NeuralDevs!',
      skills: JSON.stringify(['UI/UX Design', 'Figma', 'React']),
      status: 'PENDING'
    }
  });

  console.log('[Seed] Creating sample in-app notifications...');
  await prisma.notification.create({
    data: {
      userId: student.id,
      title: 'Welcome to CampusPulse!',
      message: 'Explore upcoming SRMIST events, discover your crowd, and build your campus story.',
      type: 'ANNOUNCEMENT'
    }
  });

  await prisma.notification.create({
    data: {
      userId: student.id,
      title: 'Ticket Confirmed: HackSRM 2026',
      message: 'Your ticket CP-HACKSRM-8F4C2 has been confirmed. View your QR pass in your dashboard.',
      type: 'REGISTRATION',
      link: `/tickets/${rohanHackTicket.ticketCode}`
    }
  });

  await prisma.notification.create({
    data: {
      userId: student.id,
      title: 'New Team Request',
      message: 'Ananya Iyer requested to join your hackathon team "NeuralDevs".',
      type: 'TEAM',
      link: `/events/${eventHackathon.slug}`
    }
  });

  console.log('[Seed] Database successfully populated with realistic campus records!');
  console.log('========================================================');
  console.log('TEST CREDENTIALS:');
  console.log('Student:   student@srmist.edu.in    / Student@123');
  console.log('Student 2: aarav@srmist.edu.in      / Student@123');
  console.log('Student 3: ananya@srmist.edu.in     / Student@123');
  console.log('Organizer: organizer@srmist.edu.in  / Organizer@123');
  console.log('Admin:     admin@srmist.edu.in      / Admin@123');
  console.log('========================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
