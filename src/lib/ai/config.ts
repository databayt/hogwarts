/**
 * AI Service Configuration
 *
 * Centralized configuration for AI grading services including:
 * - Model selection
 * - Confidence thresholds
 * - Rate limiting
 * - Cost tracking
 * - Fallback behavior
 */

export interface AIServiceConfig {
  /** Model for grading operations */
  gradingModel: string
  /** Model for vision/OCR operations */
  visionModel: string
  /** Maximum tokens per response */
  maxTokens: number
  /** Temperature for consistent grading (0.0-1.0) */
  temperature: number
  /** Cost per 1K input tokens (USD) */
  costPer1kInputTokens: number
  /** Cost per 1K output tokens (USD) */
  costPer1kOutputTokens: number
  /** Minimum confidence to auto-accept grade (0.0-1.0) */
  confidenceThreshold: number
  /** Maximum retries on API failure */
  maxRetries: number
  /** Base delay for exponential backoff (ms) */
  baseRetryDelay: number
  /** Maximum concurrent requests */
  maxConcurrent: number
  /** Enable fallback to manual grading when AI unavailable */
  enableFallback: boolean
  /** Monthly cost limit per school (USD) - 0 for unlimited */
  monthlyCostLimit: number
}

export const DEFAULT_AI_CONFIG: AIServiceConfig = {
  gradingModel: "gpt-4o",
  visionModel: "gpt-4o",
  maxTokens: 2000,
  temperature: 0.3, // Lower = more deterministic grading
  costPer1kInputTokens: 0.005,
  costPer1kOutputTokens: 0.015,
  confidenceThreshold: 0.85, // Require 85% confidence to auto-accept
  maxRetries: 3,
  baseRetryDelay: 1000,
  maxConcurrent: 5,
  enableFallback: true,
  monthlyCostLimit: 0, // Unlimited by default
}

/**
 * AI Error Types for categorization
 */
export enum AIErrorType {
  /** API key missing or invalid */
  AUTH_ERROR = "AUTH_ERROR",
  /** Rate limit exceeded */
  RATE_LIMIT = "RATE_LIMIT",
  /** API temporarily unavailable */
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  /** Request timeout */
  TIMEOUT = "TIMEOUT",
  /** Invalid response from AI */
  INVALID_RESPONSE = "INVALID_RESPONSE",
  /** Token limit exceeded */
  TOKEN_LIMIT = "TOKEN_LIMIT",
  /** Monthly cost limit reached */
  COST_LIMIT = "COST_LIMIT",
  /** Unknown error */
  UNKNOWN = "UNKNOWN",
}

/**
 * AI Service Error with typed error codes
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public type: AIErrorType,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message)
    this.name = "AIServiceError"
  }

  static fromError(error: unknown): AIServiceError {
    if (error instanceof AIServiceError) {
      return error
    }

    const err = error as any
    const message = err?.message || "Unknown AI service error"
    const status = err?.status || err?.response?.status

    // Categorize error by status code or message
    if (status === 401 || status === 403) {
      return new AIServiceError(
        "AI service authentication failed",
        AIErrorType.AUTH_ERROR,
        false,
        err
      )
    }

    if (status === 429) {
      return new AIServiceError(
        "AI service rate limit exceeded",
        AIErrorType.RATE_LIMIT,
        true,
        err
      )
    }

    if (status === 503 || status === 502 || status === 504) {
      return new AIServiceError(
        "AI service temporarily unavailable",
        AIErrorType.SERVICE_UNAVAILABLE,
        true,
        err
      )
    }

    if (message.includes("timeout") || err?.code === "ETIMEDOUT") {
      return new AIServiceError(
        "AI service request timed out",
        AIErrorType.TIMEOUT,
        true,
        err
      )
    }

    if (message.includes("token") && message.includes("limit")) {
      return new AIServiceError(
        "AI request exceeded token limit",
        AIErrorType.TOKEN_LIMIT,
        false,
        err
      )
    }

    return new AIServiceError(message, AIErrorType.UNKNOWN, false, err)
  }
}

/**
 * Fallback result when AI service is unavailable
 */
export interface AIFallbackResult {
  /** Indicates this is a fallback result */
  isFallback: true
  /** Reason for fallback */
  fallbackReason: string
  /** Error type that triggered fallback */
  errorType: AIErrorType
  /** Suggested action for the user */
  suggestedAction: string
}

/**
 * Check if AI service should fallback based on error
 */
export function shouldFallback(
  error: AIServiceError,
  config: AIServiceConfig
): boolean {
  if (!config.enableFallback) {
    return false
  }

  // Always fallback for non-retryable errors
  if (!error.retryable) {
    return true
  }

  return false
}

/**
 * Create a fallback result with appropriate messaging
 */
export function createFallbackResult(error: AIServiceError): AIFallbackResult {
  const suggestedActions: Record<AIErrorType, string> = {
    [AIErrorType.AUTH_ERROR]:
      "Contact administrator to verify AI service credentials.",
    [AIErrorType.RATE_LIMIT]:
      "Wait a few minutes and try again, or grade manually.",
    [AIErrorType.SERVICE_UNAVAILABLE]:
      "AI service is temporarily down. Grade manually or try again later.",
    [AIErrorType.TIMEOUT]:
      "Request took too long. Try grading a smaller batch or grade manually.",
    [AIErrorType.INVALID_RESPONSE]:
      "AI returned invalid data. Try again or grade manually.",
    [AIErrorType.TOKEN_LIMIT]:
      "Answer too long for AI processing. Grade manually.",
    [AIErrorType.COST_LIMIT]:
      "Monthly AI budget exceeded. Contact administrator or grade manually.",
    [AIErrorType.UNKNOWN]: "An unexpected error occurred. Grade manually.",
  }

  return {
    isFallback: true,
    fallbackReason: error.message,
    errorType: error.type,
    suggestedAction: suggestedActions[error.type],
  }
}
