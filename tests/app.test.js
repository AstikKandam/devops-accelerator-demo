'use strict';
const request = require('supertest');
const app     = require('../src/app');

let authToken;

beforeAll(async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'admin123' });
  authToken = res.body.token;
});

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('POST /login', () => {
  test('returns JWT with valid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'alice', password: 'alice456' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.split('.').length).toBe(3);
  });

  test('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'notthepassword' });
    expect(res.status).toBe(401);
  });

  test('returns 400 when body fields are missing', async () => {
    const res = await request(app).post('/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /users/search', () => {
  test('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/users/search?q=alice');
    expect(res.status).toBe(401);
  });

  test('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/users/search?q=alice')
      .set('Authorization', 'Bearer not.a.token');
    expect(res.status).toBe(401);
  });

  test('returns results with valid token', async () => {
    const res = await request(app)
      .get('/users/search?q=alice')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].username).toBe('alice');
  });
});

describe('POST /users', () => {
  test('creates a user with no validation (intentional missing check)', async () => {
    const res = await request(app)
      .post('/users')
      .send({ username: 'newuser', password: 'pass', email: 'new@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe('newuser');
    expect(res.body.password).toBeUndefined(); // password stripped from response
  });
});
