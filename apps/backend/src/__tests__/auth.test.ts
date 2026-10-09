import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Authentication & Authorization Suite', () => {
  it('should successfully login with seeded student credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@srmist.edu.in',
        password: 'Student@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('student@srmist.edu.in');
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@srmist.edu.in',
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthenticated access to protected endpoints', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return current user profile when valid token is provided', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@srmist.edu.in',
        password: 'Student@123'
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.name).toBe('Rohan Sharma');
    expect(meRes.body.data.interests).toContain('AI & Machine Learning');
  });

  it('should register a new student account', async () => {
    const randomEmail = `test_${Date.now()}@srmist.edu.in`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Campus Builder',
        email: randomEmail,
        password: 'Password@123',
        department: 'Computer Science',
        graduationYear: 2027,
        interests: ['Web Development', 'Robotics & IoT']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(randomEmail);
  });
});
