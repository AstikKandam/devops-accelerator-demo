'use strict';
const express = require('express');
const { authenticate } = require('./auth');
const { getUser, searchUsers, createUser } = require('./db');

const app = express();
app.use(express.json());

// No rate limiting (intentional issue)
// No helmet / security headers (intentional issue)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// No input validation: username and password accepted as-is (intentional issue)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  const user = await getUser(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { generateToken } = require('./auth');
  const token = generateToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token });
});

// query parameter passed directly to SQL-building function (intentional injection risk)
app.get('/users/search', authenticate, async (req, res) => {
  const { q } = req.query;
  const users = await searchUsers(q);
  res.json(users);
});

// No authentication, no schema validation (intentional issues)
app.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// No authentication required on this endpoint (intentional issue)
app.get('/users/:id', async (req, res) => {
  res.json({ id: req.params.id, note: 'no auth required — intentional missing access control' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
