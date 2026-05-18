'use strict';
const jwt = require('jsonwebtoken');
const { generateToken, verifyToken, authenticate, JWT_SECRET } = require('../src/auth');

describe('generateToken', () => {
  test('returns a three-part JWT string', () => {
    const token = generateToken({ id: 1, username: 'test' });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  test('payload is preserved in the token', () => {
    const token   = generateToken({ id: 42, username: 'alice', role: 'admin' });
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe(42);
    expect(decoded.username).toBe('alice');
    expect(decoded.role).toBe('admin');
  });
});

describe('verifyToken', () => {
  test('verifies a freshly issued token without throwing', () => {
    const token = generateToken({ id: 1 });
    expect(() => verifyToken(token)).not.toThrow();
  });

  test('throws on a tampered token', () => {
    const token   = generateToken({ id: 1 });
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyToken(tampered)).toThrow();
  });
});

// ── INTENTIONALLY FAILING — documents security policy violations ─────────────

describe('Security policy violations (tests intentionally fail)', () => {
  test('JWT_SECRET must be at least 32 characters [FAILS — secret is 24 chars]', () => {
    // 'super-secret-jwt-key-1234' is 24 characters — too short for HS256 security
    expect(JWT_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  test('token must expire within 1 hour [FAILS — expiry is 24 h]', () => {
    // generateToken() passes expiresIn: '24h' → 86 400 s, violating the 3 600 s policy
    const token   = generateToken({ id: 1 });
    const decoded = jwt.decode(token);
    const lifetimeSecs = decoded.exp - decoded.iat;
    expect(lifetimeSecs).toBeLessThanOrEqual(3600);
  });
});

// ── authenticate middleware ───────────────────────────────────────────────────

describe('authenticate middleware', () => {
  const mockRes = () => {
    const res  = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
  };

  test('rejects request with no Authorization header', () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() and sets req.user with valid token', () => {
    const token = generateToken({ id: 1, username: 'test' });
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    const next  = jest.fn();
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.username).toBe('test');
  });
});
