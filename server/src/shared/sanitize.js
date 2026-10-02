/**
 * sanitize.js — Input sanitization utilities (SEC-08, SEC-09)
 *
 * Centralizes escaping/sanitization so no module does ad-hoc string handling.
 */

/**
 * Escape special regex characters from user input before using in $regex queries.
 * Prevents ReDoS (Regular Expression Denial of Service) attacks.
 * @param {string} str - Raw user input
 * @returns {string} - Escaped string safe for use in RegExp / $regex
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize MongoDB query objects to prevent NoSQL injection.
 * Strips any keys starting with $ from user-provided query params.
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
function sanitizeMongoQuery(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue; // Strip operator injection
    sanitized[key] = typeof value === 'object' && value !== null
      ? sanitizeMongoQuery(value)
      : value;
  }
  return sanitized;
}

module.exports = { escapeRegex, sanitizeMongoQuery };
