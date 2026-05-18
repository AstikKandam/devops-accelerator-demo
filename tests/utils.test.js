'use strict';
const { calculate, sanitizeInput, parseConfig, generateId } = require('../src/utils');

describe('calculate', () => {
  test('evaluates addition', ()         => expect(calculate('2 + 2')).toBe(4));
  test('evaluates multiplication', ()   => expect(calculate('6 * 7')).toBe(42));
  test('evaluates built-in Math', ()    => expect(calculate('Math.pow(2, 8)')).toBe(256));
  test('evaluates floating point', ()   => expect(calculate('0.1 + 0.2')).toBeCloseTo(0.3));
});

describe('sanitizeInput', () => {
  test('removes <script> open tag', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).not.toContain('<script>');
  });

  test('handles an empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  test('leaves safe text unchanged', () => {
    expect(sanitizeInput('hello world')).toBe('hello world');
  });

  // ── INTENTIONALLY FAILING — documents incomplete sanitization ──────────────
  test('blocks all common XSS vectors [FAILS — img/event-handler payloads pass through]', () => {
    // sanitizeInput only strips <script> tags — all other XSS vectors are untouched
    const payloads = [
      '<img src=x onerror=alert(1)>',
      '<a href="javascript:alert(1)">click</a>',
      '<div onmouseover="alert(1)">hover</div>',
    ];
    payloads.forEach(payload => {
      expect(sanitizeInput(payload)).toBe('');
    });
  });
});

describe('parseConfig', () => {
  test('parses a valid JS object literal', () => {
    const result = parseConfig('{ name: "test", retries: 3, debug: true }');
    expect(result.name).toBe('test');
    expect(result.retries).toBe(3);
    expect(result.debug).toBe(true);
  });
});

describe('generateId', () => {
  test('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('generates unique values', () => {
    const ids = new Set(Array.from({ length: 200 }, generateId));
    expect(ids.size).toBe(200);
  });
});
