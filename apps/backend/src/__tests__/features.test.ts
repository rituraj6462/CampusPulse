import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('Distinctive Features Suite (Pulse Match, Team Up, Passport, Analytics)', () => {
  let studentToken: string;
  let organizerToken: string;

  beforeAll(async () => {
    const s = await request(app).post('/api/auth/login').send({
      email: 'student@srmist.edu.in',
      password: 'Student@123'
    });
    studentToken = s.body.data.token;

    const org = await request(app).post('/api/auth/login').send({
      email: 'organizer@srmist.edu.in',
      password: 'Organizer@123'
    });
    organizerToken = org.body.data.token;
  });

  it('should return personalized Pulse Match recommendations with transparent score breakdown', async () => {
    const res = await request(app)
      .get('/api/pulse-match/recommendations')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      const first = res.body.data[0];
      expect(first.score).toBeGreaterThan(0);
      expect(first.matchReasons.length).toBeGreaterThan(0);
      expect(first.event.title).toBeDefined();
    }
  });

  it('should allow students to browse teams and send join requests for hackathons', async () => {
    const hackathon = await prisma.event.findFirst({ where: { isHackathon: true } });
    expect(hackathon).toBeDefined();

    // Register a fresh applicant so the test is completely isolated across runs
    const applicantRes = await request(app).post('/api/auth/register').send({
      name: 'Hackathon Applicant',
      email: `applicant_${Date.now()}@srmist.edu.in`,
      password: 'Password@123'
    });
    const applicantToken = applicantRes.body.data.token;

    await request(app)
      .post(`/api/events/${hackathon!.id}/register`)
      .set('Authorization', `Bearer ${applicantToken}`);

    const teamsRes = await request(app)
      .get(`/api/events/${hackathon!.id}/teams`)
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(teamsRes.status).toBe(200);
    expect(teamsRes.body.data.length).toBeGreaterThan(0);

    const team = teamsRes.body.data[0];
    expect(team.name).toBe('NeuralDevs');

    // Send join request
    const joinReqRes = await request(app)
      .post(`/api/teams/${team.id}/request`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        message: 'Applicant here, competitive coder ready to implement algorithms!',
        skills: ['C++', 'Competitive Programming', 'Algorithms']
      });

    expect(joinReqRes.status).toBe(201);
  });

  it('should return verified Campus Passport profile with unlocked badges and milestones', async () => {
    const res = await request(app)
      .get('/api/passport/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Rohan Sharma');
    expect(res.body.data.verifiedAttendanceCount).toBeGreaterThan(0);
    expect(res.body.data.achievements.length).toBeGreaterThan(0);
    expect(res.body.data.milestones.length).toBe(5);
  });

  it('should return accurate organizer analytics and export CSV of participants', async () => {
    const analyticsRes = await request(app)
      .get('/api/organizer/analytics')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.totalEvents).toBeGreaterThan(0);
    expect(analyticsRes.body.data.averageCapacityUtilization).toBeDefined();
    expect(analyticsRes.body.data.recentRegistrationsTrend.length).toBe(14);

    const event = await prisma.event.findFirst();
    const csvRes = await request(app)
      .get(`/api/organizer/events/${event!.id}/export-csv`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.text).toContain('Registration ID,Student Name,Email');
  });
});
