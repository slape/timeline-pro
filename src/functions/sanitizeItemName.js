import validator from 'validator';

/**
 * Sanitizes user input for item names before storing to Monday.com
 * 
 * This function uses validator.js library for robust string sanitization:
 * - Escapes HTML entities to prevent XSS
 * - Trims leading/trailing whitespace
 * - Normalizes whitespace and line breaks
 * - Ensures the result is safe for GraphQL JSON strings
 * - Preserves basic punctuation and international characters
 * 
 * @param {string} input - The raw user input to sanitize
 * @returns {string} - The sanitized string safe for Monday.com storage
 */
const sanitizeItemName = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Use validator.js for robust HTML escaping and trimming
  sanitized = validator.escape(sanitized);  // Escapes HTML entities (&, <, >, ", ')
  sanitized = validator.trim(sanitized);    // Trims whitespace from both ends
  
  // Remove control characters using validator.js (keeps newlines for now)
  sanitized = validator.stripLow(sanitized, true);  // Remove control chars, keep newlines
  
  // Remove potentially dangerous characters that could break GraphQL using blacklist
  sanitized = validator.blacklist(sanitized, '{}[]\\`|');
  
  // Normalize whitespace - replace multiple spaces, tabs, newlines with single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Final trim after whitespace normalization
  sanitized = validator.trim(sanitized);
  
  // Limit length to Monday.com's maximum (255 characters)
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
    // Trim again after truncation to avoid trailing spaces
    sanitized = validator.trim(sanitized);
  }
  
  return sanitized;
};

export default sanitizeItemName;
