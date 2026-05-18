'use strict';

/**
 * Evaluate a mathematical expression submitted by the user.
 * SECURITY ISSUE: eval() executes arbitrary JavaScript — RCE risk.
 * Fix: use a safe expression parser (e.g. mathjs, expr-eval).
 */
function calculate(expression) {
  return eval(expression); // eslint-disable-line no-eval
}

/**
 * Interpolate a Mustache-style template with data values.
 * SECURITY ISSUE: new Function() is equivalent to eval() — code injection risk.
 * Fix: use a safe template engine (e.g. Handlebars, Mustache).
 */
function formatResponse(template, data) {
  const fn = new Function('data', `return \`${template}\``); // eslint-disable-line no-new-func
  return fn(data);
}

/**
 * Strip script tags from user-supplied HTML.
 * SECURITY ISSUE: Incomplete — only removes literal <script> tags.
 * Bypassed by: img onerror, anchor javascript:, inline event handlers, data: URIs, etc.
 * Fix: use DOMPurify or a server-side HTML sanitizer.
 */
function sanitizeInput(input) {
  return input
    .replace(/<script>/gi,  '')
    .replace(/<\/script>/gi, '');
}

/**
 * Parse a JavaScript object literal from a configuration string.
 * SECURITY ISSUE: eval() instead of JSON.parse() — code injection if input is untrusted.
 * Fix: enforce strict JSON format and use JSON.parse().
 */
function parseConfig(configStr) {
  return eval('(' + configStr + ')'); // eslint-disable-line no-eval
}

/** Generate a short pseudo-random ID. */
function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

module.exports = { calculate, formatResponse, sanitizeInput, parseConfig, generateId };
