// Security utilities for the hospital management system

/**
 * Sanitize input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format) - Made more lenient for testing
 */
export const isValidPhone = (phone: string): boolean => {
  // Remove spaces and check for minimum length
  const cleanedPhone = phone.replace(/\s/g, "");
  return cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
};

/**
 * Validate Aadhaar number (12 digits)
 */
export const isValidAadhaar = (aadhaar: string): boolean => {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar.replace(/\s/g, ""));
};

/**
 * Validate PAN number (Indian format)
 */
export const isValidPAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase().replace(/\s/g, ""));
};

/**
 * Validate age (reasonable range) - Made more lenient for testing
 */
export const isValidAge = (age: string): boolean => {
  const ageNum = parseInt(age);
  return !isNaN(ageNum) && ageNum > 0 && ageNum < 200;
};

/**
 * Validate date of birth (not in future)
 */
export const isValidDateOfBirth = (dateString: string): boolean => {
  if (!dateString) return true; // Optional field

  const date = new Date(dateString);
  const now = new Date();

  return date < now && date.getFullYear() > 1900;
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * Validate required fields
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): string[] => {
  const errors: string[] = [];

  requiredFields.forEach((field) => {
    if (
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
    ) {
      errors.push(`${field} is required`);
    }
  });

  return errors;
};

/**
 * Validate patient registration data
 */
export const validatePatientData = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  const requiredFields = [
    "firstName",
    "lastName",
    "phone",
    "age",
    "gender",
    "department",
    "reason",
  ];
  const requiredErrors = validateRequiredFields(data, requiredFields);
  errors.push(...requiredErrors);

  // Email validation (if provided)
  if (data.email && !isValidEmail(data.email)) {
    errors.push("Invalid email format");
  }

  // Phone validation
  if (!isValidPhone(data.phone)) {
    errors.push("Invalid phone number format");
  }

  // Age validation
  if (!isValidAge(data.age)) {
    errors.push("Invalid age");
  }

  // Date of birth validation
  if (!isValidDateOfBirth(data.dateOfBirth)) {
    errors.push("Invalid date of birth");
  }

  // Aadhaar validation (if provided)
  if (data.aadhaarNumber && !isValidAadhaar(data.aadhaarNumber)) {
    errors.push("Invalid Aadhaar number format");
  }

  // PAN validation (if provided)
  if (data.panNumber && !isValidPAN(data.panNumber)) {
    errors.push("Invalid PAN number format");
  }

  // BPL card validation
  if (data.hasBPLCard && !data.bplCardNumber) {
    errors.push("BPL card number is required when BPL card is selected");
  }

  // Yellow card validation
  if (data.hasYellowCard && !data.yellowCardNumber) {
    errors.push("Yellow card number is required when yellow card is selected");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize patient data before processing
 */
export const sanitizePatientData = (data: any): any => {
  const sanitized: any = {};

  // Sanitize string fields
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") {
      sanitized[key] = sanitizeInput(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  });

  return sanitized;
};

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
};

/**
 * Security headers configuration
 */
export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/**
 * Password strength validation
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Check for SQL injection patterns
 */
export const containsSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)(\s|$)/i,
    /(\s|^)(FROM|INTO|WHERE|SET|VALUES)(\s|$)/i,
    /['";\\]/,
    /(\s|^)(OR|AND)(\s+)(\d+\s*=\s*\d+)(\s|$)/i,
    /(\s|^)(OR|AND)(\s+)(\w+\s*=\s*'\w+')(\s|$)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * Validate login credentials
 */
export const validateLoginCredentials = (
  email: string,
  password: string
): string[] => {
  const errors: string[] = [];

  if (!email || !isValidEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (containsSQLInjection(email) || containsSQLInjection(password)) {
    errors.push("Invalid input detected");
  }

  return errors;
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};
