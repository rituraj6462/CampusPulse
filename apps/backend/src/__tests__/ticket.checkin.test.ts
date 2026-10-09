import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('QR Ticket Validation & Duplicate Check-in Suite', () => {
  it('should successfully check in valid ticket and prevent duplicate check-in', async () => {
    // 1. Login organizer and student
    const orgLogin = await request(app).post('/api/auth/login').send({
      email: 'organizer@srmist.edu.in',
      password: 'Organizer@123'
    });
    const organizerToken = orgLogin.body.data.token;

    const studentLogin = await request(app).post('/api/auth/login').send({
      email: 'student@srmist.edu.in',
      password: 'Student@123'
    });
    const studentToken = studentLogin.body.data.token;

    // Retrieve Rohan's ticket for HackSRM
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketCode: 'CP-HACKSRM-8F4C2',
        status: 'VALID'
      }
    });
    expect(ticket).toBeDefined();

    // 2. Unauthorized attempt: Student tries to act as scanner
    const unauthorizedRes = await request(app)
      .post('/api/tickets/check-in')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        ticketCode: ticket!.ticketCode,
        eventId: ticket!.eventId
      });
    expect(unauthorizedRes.status).toBe(403);

    // 3. Authorized check-in by organizer
    const checkInRes = await request(app)
      .post('/api/tickets/check-in')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        ticketCode: ticket!.ticketCode,
        eventId: ticket!.eventId
      });

    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.success).toBe(true);
    expect(checkInRes.body.attendee.name).toBe('Rohan Sharma');
    expect(checkInRes.body.checkedInAt).toBeDefined();

    // Verify ticket status in DB is now CHECKED_IN
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticket!.id }
    });
    expect(updatedTicket?.status).toBe('CHECKED_IN');

    // Verify Attendance table has attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { ticketId: ticket!.id }
    });
    expect(attendance).toBeDefined();
    expect(attendance?.userId).toBe(ticket!.userId);

    // 4. Repeated check-in attempt MUST be rejected with 409 Conflict
    const duplicateRes = await request(app)
      .post('/api/tickets/check-in')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        ticketCode: ticket!.ticketCode,
        eventId: ticket!.eventId
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error).toContain('DUPLICATE SCAN WARNING');
  });
});
