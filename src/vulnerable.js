'use strict';
/**
 * DEMO FILE — intentionally insecure code for AI risk-detection demo.
 * Do NOT deploy to production.
 * v2
 */

const db = require('./db');

// ── CRITICAL: Hardcoded secret ────────────────────────────────────────────────
const JWT_SECRET = 'HARDCODED_SECRET_DO_NOT_SHIP';   // triggers: secret.jwt.hardcoded

// ── CRITICAL: SQL injection via string concatenation ─────────────────────────
async function searchUsers(query) {
  // LIKE '+query+' — raw user input concatenated into SQL
  const sql = "SELECT * FROM users WHERE name LIKE '%" + query + "%'";
  return db.raw(sql);
}

// ── HIGH: eval() — arbitrary code execution ───────────────────────────────────
function runDynamicRule(ruleStr) {
  return eval(ruleStr);   // never pass user input here
}

// ── HIGH: new Function() — equivalent to eval ─────────────────────────────────
function buildValidator(logic) {
  const fn = new Function('input', logic);
  return fn;
}

// ── MEDIUM: plaintext password storage ────────────────────────────────────────
async function createUser(username, rawPassword) {
  // password: data.password stored as plain text — use bcrypt
  await db('users').insert({ username, password: rawPassword });
}

// ── MEDIUM: no input validation on user-controlled data ───────────────────────
function parseConfig(userInput) {
  return JSON.parse(userInput);   // DoS via deeply nested JSON
}

module.exports = { searchUsers, runDynamicRule, buildValidator, createUser, parseConfig };
