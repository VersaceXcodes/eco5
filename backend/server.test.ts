import request from 'supertest';
import { app, pool } from './server.ts';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

// Helper function to generate JWT
const generateTestToken = (userId) => {
  return jwt.sign({ user_id: userId }, 'test-jwt-secret');
};

// Setup and Teardown for database
beforeAll(async () => {
  await pool.query('BEGIN');
});

afterAll(async () => {
  await pool.query('ROLLBACK');
  pool.end();
});

describe('User Registration', () => {
  it('should create a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new_user@example.com',
        name: 'New User',
        password_hash: 'newpassword123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('new_user@example.com');
  });

  it('should not register user with existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'john.doe@example.com',
        name: 'Duplicate User',
        password_hash: 'duplicatepassword',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('User Login', () => {
  it('should login user and return a token', async () => {
    jwt.sign.mockImplementation(() => 'fake-jwt-token');
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password_hash: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('auth_token');
    expect(res.body.auth_token).toBe('fake-jwt-token');
  });

  it('should not login user with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password_hash: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Protected Routes', () => {
  it('should deny access to an authenticated user without token', async () => {
    const res = await request(app).get('/api/dashboard/user1');
    expect(res.statusCode).toEqual(401);
  });

  it('should allow access to authenticated user with valid token', async () => {
    jwt.verify.mockImplementation(() => ({ user_id: 'user1' }));
    const res = await request(app)
      .get('/api/dashboard/user1')
      .set('Authorization', `Bearer fake-jwt-token`);
    expect(res.statusCode).toEqual(200);
  });
});

describe('CRUD Operations', () => {
  describe('/events endpoint', () => {
    let eventId;

    it('should create a new event', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${generateTestToken('user1')}`)
        .send({
          event_name: 'Green Meetup',
          event_date: '2023-10-10',
          location: 'Green Park',
          organizer_id: 'user1',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      eventId = res.body.id;
    });

    it('should update an existing event', async () => {
      const res = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${generateTestToken('user1')}`)
        .send({ location: 'Updated Location' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.location).toBe('Updated Location');
    });

    it('should delete the event', async () => {
      const res = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${generateTestToken('user1')}`);
      expect(res.statusCode).toEqual(200);
    });
  });
});