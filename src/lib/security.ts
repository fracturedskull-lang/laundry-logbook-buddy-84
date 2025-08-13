import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitizes text input by removing/escaping potentially dangerous characters
 */
export const sanitizeTextInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 500); // Limit length
};

/**
 * Validates and sanitizes weight input
 */
export const sanitizeWeight = (weight: string): string => {
  const sanitized = weight.replace(/[^\d.]/g, '');
  const num = parseFloat(sanitized);
  return isNaN(num) ? '' : Math.min(Math.max(num, 0), 9999).toString();
};

/**
 * Rate limiting utility for form submissions
 */
class RateLimiter {
  private lastSubmission = 0;
  private readonly minInterval = 2000; // 2 seconds between submissions

  canSubmit(): boolean {
    const now = Date.now();
    if (now - this.lastSubmission < this.minInterval) {
      return false;
    }
    this.lastSubmission = now;
    return true;
  }

  getTimeUntilNext(): number {
    const now = Date.now();
    const remaining = this.minInterval - (now - this.lastSubmission);
    return Math.max(0, remaining);
  }
}

export const formRateLimiter = new RateLimiter();