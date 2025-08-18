
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
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10;
};

/**
 * Validates payment amount
 */
export const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000;
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

/**
 * Security headers for API requests
 */
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
});

/**
 * Validate user input against common injection patterns
 */
export const validateInput = (input: string): { isValid: boolean; error?: string } => {
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /(\'|\")(\s*;\s*|\s*--|\s*\/\*)/i
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, error: 'Invalid characters detected' };
    }
  }

  // Check for XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, error: 'Invalid content detected' };
    }
  }

  return { isValid: true };
};
