import { z } from "zod"

/**
 * Production-ready validation utilities for onboarding forms
 */

// Common validation patterns
export const VALIDATION_PATTERNS = {
  // School name validation
  SCHOOL_NAME: /^[a-zA-Z0-9\s\-'.,&()]+$/,

  // Subdomain validation
  SUBDOMAIN: /^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/,

  // URL validation
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,

  // Phone number validation (international)
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,

  // Postal code validation
  POSTAL_CODE: /^[A-Z0-9\s\-]{3,10}$/i,
} as const

// Enhanced validation schemas
export const createSecureStringSchema = (options: {
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  required?: boolean
}) => {
  let schema = z.string()

  if (options.required !== false) {
    schema = schema.min(1, "This field is required")
  }

  if (options.minLength) {
    schema = schema.min(
      options.minLength,
      `Must be at least ${options.minLength} characters`
    )
  }

  if (options.maxLength) {
    schema = schema.max(
      options.maxLength,
      `Must be no more than ${options.maxLength} characters`
    )
  }

  if (options.pattern) {
    schema = schema.regex(options.pattern, "Invalid format")
  }

  // Sanitize input to prevent XSS
  return schema.transform((val) => val.trim().replace(/[<>]/g, ""))
}

export const createNumberSchema = (options: {
  min?: number
  max?: number
  integer?: boolean
  positive?: boolean
}) => {
  let schema = z.number()

  if (options.integer) {
    schema = schema.int("Must be a whole number")
  }

  if (options.positive) {
    schema = schema.positive("Must be positive")
  }

  if (options.min !== undefined) {
    schema = schema.min(options.min, `Must be at least ${options.min}`)
  }

  if (options.max !== undefined) {
    schema = schema.max(options.max, `Must be no more than ${options.max}`)
  }

  return schema
}

// Rate limiting for form submissions
export class FormSubmissionRateLimit {
  private submissions = new Map<string, number[]>()
  private readonly maxSubmissions: number
  private readonly windowMs: number

  constructor(maxSubmissions = 5, windowMs = 60000) {
    this.maxSubmissions = maxSubmissions
    this.windowMs = windowMs
  }

  canSubmit(identifier: string): boolean {
    const now = Date.now()
    const userSubmissions = this.submissions.get(identifier) || []

    // Remove old submissions outside the time window
    const recentSubmissions = userSubmissions.filter(
      (timestamp) => now - timestamp < this.windowMs
    )

    this.submissions.set(identifier, recentSubmissions)

    return recentSubmissions.length < this.maxSubmissions
  }

  recordSubmission(identifier: string): void {
    const now = Date.now()
    const userSubmissions = this.submissions.get(identifier) || []
    userSubmissions.push(now)
    this.submissions.set(identifier, userSubmissions)
  }
}

// Global rate limiter instance
export const formRateLimit = new FormSubmissionRateLimit()

// Enhanced error handling
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

export class RateLimitError extends Error {
  constructor(message = "Too many requests. Please wait before trying again.") {
    super(message)
    this.name = "RateLimitError"
  }
}

// Input sanitization utilities
export const sanitizeInput = {
  text: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential XSS characters
      .replace(/\s+/g, " ") // Normalize whitespace
  },

  url: (input: string): string => {
    try {
      const url = new URL(input)
      // Only allow http/https protocols
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Invalid protocol")
      }
      return url.toString()
    } catch {
      throw new ValidationError("Invalid URL format")
    }
  },

  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9\-_\.]/g, "") // Remove special characters
      .substring(0, 255) // Limit length
  },
}

// Validation middleware for form submissions
export const withValidation = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  identifier?: string
): Promise<T> => {
  // Check rate limiting if identifier provided
  if (identifier && !formRateLimit.canSubmit(identifier)) {
    throw new RateLimitError()
  }

  try {
    const validatedData = await schema.parseAsync(data)

    // Record successful submission for rate limiting
    if (identifier) {
      formRateLimit.recordSubmission(identifier)
    }

    return validatedData
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw new ValidationError(
        firstError.message,
        firstError.path.join("."),
        firstError.code
      )
    }
    throw error
  }
}
