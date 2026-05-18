'use strict';

// In-memory store simulating a relational database
const _users = [
  { id: 1, username: 'admin',   password: 'admin123', email: 'admin@example.com',   role: 'admin' },
  { id: 2, username: 'alice',   password: 'alice456', email: 'alice@example.com',   role: 'user'  },
  { id: 3, username: 'bob',     password: 'bob789',   email: 'bob@example.com',     role: 'user'  },
  { id: 4, username: 'charlie', password: 'charlie0', email: 'charlie@example.com', role: 'user'  },
];
let _nextId = 5;

async function getUser(username) {
  return _users.find(u => u.username === username) || null;
}

async function getUserById(id) {
  return _users.find(u => u.id === Number(id)) || null;
}

async function searchUsers(query) {
  // SECURITY ISSUE: SQL query assembled by string concatenation — SQL injection risk.
  // In production with a real DB driver this executes as:
  //   db.query("SELECT * FROM users WHERE username LIKE '%" + query + "%'")
  // An attacker can pass: query = "' OR '1'='1"
  const rawSql = "SELECT * FROM users WHERE username LIKE '%" + query + "%'";
  console.log('[db] Executing:', rawSql);

  if (!query) return _users.map(_safeUser);
  return _users
    .filter(u => u.username.includes(query) || u.email.includes(query))
    .map(_safeUser);
}

async function createUser(data) {
  // SECURITY ISSUE: Password stored in plain text — should be hashed with bcrypt
  const user = {
    id:       _nextId++,
    username: data.username,
    password: data.password,   // no hashing
    email:    data.email   || '',
    role:     data.role    || 'user',
  };
  _users.push(user);
  return _safeUser(user);
}

function _safeUser(u) {
  return { id: u.id, username: u.username, email: u.email, role: u.role };
}

module.exports = { getUser, getUserById, searchUsers, createUser };
