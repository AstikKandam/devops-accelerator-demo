'use strict';
const jwt = require('jsonwebtoken');

// SECURITY ISSUE: Secret hardcoded in source — must be in process.env.JWT_SECRET
// Correct: const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET = 'super-secret-jwt-key-1234';

function generateToken(payload) {
  // SECURITY ISSUE: 24-hour expiry increases the window of a stolen token being usable
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { generateToken, verifyToken, authenticate, JWT_SECRET };
