/**
 * Input validation utilities for Edge Functions.
 * Implements defense-in-depth input sanitization.
 */

/**
 * Sanitize string input to prevent injection attacks.
 * Removes potential XSS vectors and dangerous patterns.
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  return String(input)
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove script tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (potential XSS vector)
    .replace(/data:/gi, '');
}

/**
 * Validate UUID format.
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate string length within bounds.
 */
export function isValidLength(
  value: string,
  min: number,
  max: number
): boolean {
  const len = value?.length ?? 0;
  return len >= min && len <= max;
}

/**
 * Validate number is within range.
 */
export function isValidRange(
  value: number,
  min: number,
  max: number
): boolean {
  return typeof value === 'number' && 
    !isNaN(value) && 
    value >= min && 
    value <= max;
}

/**
 * Validate value is in allowed list (whitelist validation).
 */
export function isInAllowedList<T>(value: T, allowed: T[]): boolean {
  return allowed.includes(value);
}

/**
 * Create a validation result object.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function createValidationResult(errors: string[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
  };
}
