import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('Cancellation & Smart Waitlist Promotion Suite', () => {
  it('should automatically promote waitlisted student when a seat is cancelled', async () => {
    // Create an event with capacity 1
    const org = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });
    const waitlistEvent = await prisma.event.create({
      data: {
        title: 'Waitlist Promotion Test Event',
        slug: `waitlist-promo-${Date.now()}`,
        shortDescription: 'Testing automatic promotion logic',
        description: 'Verifies atomic promotion upon seat cancellation.',
        category: 'Workshops & Seminars',
        venue: 'Room 204',
        organizerId: org!.id,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        registrationDeadline: new Date(Date.now() + 50000000),
        capacity: 1,
        status: 'PUBLISHED'
      }
    });

    // Student A registers
    const userA = await request(app).post('/api/auth/register').send({
      name: 'User A (First Registered)',
      email: `usera_${Date.now()}@srmist.edu.in`,
      password: 'Password@123'
    });
    const regARes = await request(app)
      .post(`/api/events/${waitlistEvent.id}/register`)
      .set('Authorization', `Bearer ${userA.body.data.token}`);
    expect(regARes.status).toBe(201);

    // Student B attempts to register -> rejected as full -> joins waitlist
    const userB = await request(app).post('/api/auth/register').send({
      name: 'User B (Waitlist #1)',
      email: `userb_${Date.now()}@srmist.edu.in`,
      password: 'Password@123'
    });
    const joinWaitlistRes = await request(app)
      .post(`/api/events/${waitlistEvent.id}/waitlist/join`)
      .set('Authorization', `Bearer ${userB.body.data.token}`);
    expect(joinWaitlistRes.status).toBe(200);
    expect(joinWaitlistRes.body.data.position).toBe(1);

    // Student A cancels registration
    const cancelRes = await request(app)
      .post(`/api/events/${waitlistEvent.id}/cancel`)
      .set('Authorization', `Bearer ${userA.body.data.token}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // Verify Student A's ticket is VOIDED
    const ticketA = await prisma.ticket.findFirst({
      where: { eventId: waitlistEvent.id, userId: userA.body.data.user.id }
    });
    expect(ticketA?.status).toBe('VOIDED');

    // Verify Student B was promoted to CONFIRMED!
    const regB = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: waitlistEvent.id, userId: userB.body.data.user.id } }
    });
    expect(regB?.status).toBe('CONFIRMED');

    // Verify Student B has an active VALID ticket issued!
    const ticketB = await prisma.ticket.findFirst({
      where: { eventId: waitlistEvent.id, userId: userB.body.data.user.id }
    });
    expect(ticketB?.status).toBe('VALID');
    expect(ticketB?.ticketCode).toMatch(/^CP-/);

    // Verify waitlist status for Student B is updated to ACCEPTED
    const waitlistB = await prisma.waitlistEntry.findUnique({
      where: { eventId_userId: { eventId: waitlistEvent.id, userId: userB.body.data.user.id } }
    });
    expect(waitlistB?.status).toBe('ACCEPTED');
  });
});
