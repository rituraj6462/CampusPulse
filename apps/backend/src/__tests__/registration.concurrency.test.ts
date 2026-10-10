import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('Event Registration, Capacity & Concurrency Suite', () => {
  let studentToken: string;
  let organizerToken: string;
  let openEventId: string;

  beforeAll(async () => {
    const s1 = await request(app).post('/api/auth/login').send({
      email: 'student@srmist.edu.in',
      password: 'Student@123'
    });
    studentToken = s1.body.data.token;

    const org = await request(app).post('/api/auth/login').send({
      email: 'organizer@srmist.edu.in',
      password: 'Organizer@123'
    });
    organizerToken = org.body.data.token;
    const organizerUser = org.body.data.user;

    // Create an isolated open event for Test 1 (valid reg) and Test 2 (duplicate reg rejection)
    const timestamp = Date.now();
    const openEvent = await prisma.event.create({
      data: {
        title: `Open Event For Reg Suite ${timestamp}`,
        slug: `open-event-reg-${timestamp}`,
        shortDescription: 'Dedicated test event for registration flows',
        description: 'Isolated test event.',
        category: 'Workshops & Seminars',
        venue: 'Hall 3',
        organizerId: organizerUser.id,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        registrationDeadline: new Date(Date.now() + 40000000),
        capacity: 50,
        status: 'PUBLISHED'
      }
    });
    openEventId = openEvent.id;
  });

  it('should successfully register a student for an open event and return a valid QR ticket', async () => {
    const res = await request(app)
      .post(`/api/events/${openEventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket.ticketCode).toMatch(/^CP-/);
    expect(res.body.data.ticket.status).toBe('VALID');
  });

  it('should reject duplicate registration for the same event with 409 Conflict', async () => {
    const res = await request(app)
      .post(`/api/events/${openEventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already registered');
  });

  it('should reject registration when event is at full capacity', async () => {
    const org = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });
    const existingStudent = await prisma.user.findFirst({ where: { role: 'STUDENT' } });

    // Create an isolated event with capacity 1 and pre-fill the only seat
    const timestamp = Date.now();
    const fullEvent = await prisma.event.create({
      data: {
        title: `Full Event ${timestamp}`,
        slug: `full-event-${timestamp}`,
        shortDescription: 'Isolated full capacity test event',
        description: 'Testing capacity limit boundary.',
        category: 'Workshops & Seminars',
        venue: 'Room 105',
        organizerId: org!.id,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        registrationDeadline: new Date(Date.now() + 40000000),
        capacity: 1,
        status: 'PUBLISHED'
      }
    });

    await prisma.registration.create({
      data: {
        eventId: fullEvent.id,
        userId: existingStudent!.id,
        status: 'CONFIRMED'
      }
    });

    // Create a new fresh student to attempt registration
    const freshStudentRes = await request(app).post('/api/auth/register').send({
      name: 'Late Applicant',
      email: `late_${Date.now()}@srmist.edu.in`,
      password: 'Password@123'
    });
    const freshToken = freshStudentRes.body.data.token;

    const res = await request(app)
      .post(`/api/events/${fullEvent.id}/register`)
      .set('Authorization', `Bearer ${freshToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('capacity');
  });

  it('should handle concurrent registration requests safely and never exceed capacity', async () => {
    // Create a temporary micro-event with capacity = 1
    const microEvent = await prisma.event.create({
      data: {
        title: 'Micro Exclusive Round Table',
        slug: `micro-exclusive-${Date.now()}`,
        shortDescription: 'High demand 1-seat test event',
        description: 'Testing concurrency safety for the final seat.',
        category: 'Workshops & Seminars',
        venue: 'Room 101',
        organizerId: (await prisma.user.findFirst({ where: { role: 'ORGANIZER' } }))!.id,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        registrationDeadline: new Date(Date.now() + 40000000),
        capacity: 1,
        status: 'PUBLISHED'
      }
    });

    // Create 3 distinct users simultaneously attempting to claim the single seat
    const user1 = await request(app).post('/api/auth/register').send({
      name: 'Racer 1',
      email: `racer1_${Date.now()}@srmist.edu.in`,
      password: 'Password@123'
    });
    const user2 = await request(app).post('/api/auth/register').send({
      name: 'Racer 2',
      email: `racer2_${Date.now()}@srmist.edu.in`,
      password: 'Password@123'
    });
    const user3 = await request(app).post('/api/auth/register').send({
      name: 'Racer 3',
      email: `racer3_${Date.now()}@srmist.edu.in`,
      password: 'Password@123'
    });

    // Fire all three requests concurrently
    const [res1, res2, res3] = await Promise.all([
      request(app).post(`/api/events/${microEvent.id}/register`).set('Authorization', `Bearer ${user1.body.data.token}`),
      request(app).post(`/api/events/${microEvent.id}/register`).set('Authorization', `Bearer ${user2.body.data.token}`),
      request(app).post(`/api/events/${microEvent.id}/register`).set('Authorization', `Bearer ${user3.body.data.token}`)
    ]);

    const results = [res1, res2, res3];
    const successes = results.filter(r => r.status === 201);
    const conflicts = results.filter(r => r.status === 409);

    // Exactly 1 user must succeed, and exactly 2 must be rejected with 409!
    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(2);

    // Verify database count is exactly 1 (never exceeds capacity)
    const confirmedCount = await prisma.registration.count({
      where: { eventId: microEvent.id, status: 'CONFIRMED' }
    });
    expect(confirmedCount).toBe(1);
  });
});
