/**
 * Utility Type Definitions
 * Advanced TypeScript patterns for the banking module
 */

import type { z } from "zod"

// ============================================================================
// Discriminated Unions
// ============================================================================

/**
 * Loading state with discriminated union for better type narrowing
 */
export type LoadingState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T; timestamp: Date }
  | { status: "error"; error: Error; retryCount: number }

/**
 * Form state with discriminated union
 */
export type FormState<T> =
  | { status: "idle" }
  | { status: "loading"; data: Partial<T> }
  | { status: "success"; data: T; message?: string }
  | { status: "error"; errors: FormErrors; data: Partial<T> }
  | { status: "validating"; data: Partial<T> }

export interface FormErrors {
  root?: string[]
  fields?: Record<string, string[]>
}

/**
 * Connection state for Plaid Link
 */
export type PlaidConnectionState =
  | { status: "disconnected" }
  | { status: "connecting"; institutionName: string }
  | { status: "connected"; institutionName: string; accountId: string }
  | { status: "error"; error: string; canRetry: boolean }
  | { status: "expired"; lastConnected: Date }

/**
 * Sync state for data synchronization
 */
export type SyncState =
  | { status: "idle"; lastSync: Date | null }
  | { status: "syncing"; progress: number; message: string }
  | { status: "completed"; syncedAt: Date; itemsCount: number }
  | { status: "failed"; error: string; failedAt: Date }
  | { status: "partial"; syncedCount: number; failedCount: number }

// ============================================================================
// Generic Utility Types
// ============================================================================

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>
    }
  : T

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined

/**
 * Nullish type helper
 */
export type Nullish<T> = T | null | undefined

/**
 * Extract non-nullable keys
 */
export type NonNullableKeys<T> = {
  [K in keyof T]: T[K] extends NonNullable<T[K]> ? K : never
}[keyof T]

/**
 * Extract nullable keys
 */
export type NullableKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : null extends T[K] ? K : never
}[keyof T]

/**
 * Required keys only
 */
export type RequiredKeys<T> = Exclude<keyof T, NullableKeys<T>>

/**
 * Pick required fields
 */
export type PickRequired<T> = Pick<T, RequiredKeys<T>>

/**
 * Pick optional fields
 */
export type PickOptional<T> = Pick<T, NullableKeys<T>>

// ============================================================================
// Template Literal Types
// ============================================================================

/**
 * Currency codes
 */
export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD"

/**
 * Formatted amount string
 */
export type FormattedAmount = `${CurrencyCode} ${number}`

/**
 * Account mask format
 */
export type AccountMask = `•••• ${string}`

/**
 * Date format strings
 */
export type DateFormat = "short" | "medium" | "long" | "full" | "relative"

/**
 * Time period strings
 */
export type TimePeriod =
  | `${number}d`
  | `${number}w`
  | `${number}m`
  | `${number}y`

// ============================================================================
// Conditional Types
// ============================================================================

/**
 * Extract promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never

/**
 * Function return type
 */
export type ReturnTypeAsync<T extends (...args: any) => any> = UnwrapPromise<
  ReturnType<T>
>

/**
 * Check if type is any
 */
export type IsAny<T> = 0 extends 1 & T ? true : false

/**
 * Check if type is never
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * Check if type is unknown
 */
export type IsUnknown<T> =
  IsAny<T> extends true ? false : unknown extends T ? true : false

// ============================================================================
// Mapped Types
// ============================================================================

/**
 * Make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Make specified properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Modify type of specific properties
 */
export type Modify<T, R> = Omit<T, keyof R> & R

/**
 * Stringify all properties
 */
export type Stringify<T> = {
  [K in keyof T]: string
}

/**
 * Async version of all methods
 */
export type Asyncify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K]
}

// ============================================================================
// Builder Pattern Types
// ============================================================================

/**
 * Progressive builder type
 */
export type Builder<T, K extends keyof T = never> = {
  [P in K]: T[P]
} & {
  set<Key extends Exclude<keyof T, K>>(
    key: Key,
    value: T[Key]
  ): Builder<T, K | Key>
  build(): K extends keyof T ? T : never
}

/**
 * Fluent interface type
 */
export type Fluent<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => any
    ? (...args: A) => Fluent<T>
    : T[K]
} & {
  done(): T
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Zod to TypeScript type inference
 */
export type InferSchema<T extends z.ZodType<any, any, any>> = z.infer<T>

/**
 * Validation result
 */
export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: ValidationErrors }

export interface ValidationErrors {
  _errors: string[]
  [key: string]: string[] | ValidationErrors
}

/**
 * Form field state
 */
export interface FieldState<T> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
  validating: boolean
}

/**
 * Form fields state
 */
export type FormFields<T> = {
  [K in keyof T]: FieldState<T[K]>
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Banking event types
 */
export type BankingEvent =
  | {
      type: "ACCOUNT_CONNECTED"
      payload: { accountId: string; institutionName: string }
    }
  | { type: "ACCOUNT_DISCONNECTED"; payload: { accountId: string } }
  | {
      type: "TRANSACTION_CREATED"
      payload: { transactionId: string; amount: number }
    }
  | {
      type: "TRANSFER_INITIATED"
      payload: { transferId: string; amount: number }
    }
  | { type: "TRANSFER_COMPLETED"; payload: { transferId: string } }
  | { type: "TRANSFER_FAILED"; payload: { transferId: string; error: string } }
  | { type: "SYNC_STARTED"; payload: { accountId: string } }
  | {
      type: "SYNC_COMPLETED"
      payload: { accountId: string; transactionCount: number }
    }
  | { type: "SYNC_FAILED"; payload: { accountId: string; error: string } }

/**
 * Event handler type
 */
export type EventHandler<T extends BankingEvent> = (
  event: T
) => void | Promise<void>

/**
 * Event listener map
 */
export type EventListeners = {
  [K in BankingEvent["type"]]?: EventHandler<Extract<BankingEvent, { type: K }>>
}

// ============================================================================
// API Types
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  meta?: {
    timestamp: string
    version: string
    requestId: string
  }
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
    timestamp: string
    path?: string
  }
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

/**
 * Cache key generator
 */
export type CacheKeyGenerator<T extends Record<string, any>> = (
  params: T
) => string

/**
 * Cache invalidation strategy
 */
export type CacheInvalidationStrategy =
  | { type: "time-based"; ttl: number }
  | { type: "event-based"; events: string[] }
  | { type: "tag-based"; tags: string[] }
  | { type: "manual" }

// ============================================================================
// Type Predicates & Assertions
// ============================================================================

/**
 * Type predicate for loading state
 */
export function isLoadingState<T>(
  state: LoadingState<T>
): state is Extract<LoadingState<T>, { status: "loading" }> {
  return state.status === "loading"
}

/**
 * Type predicate for success state
 */
export function isSuccessState<T>(
  state: LoadingState<T>
): state is Extract<LoadingState<T>, { status: "success" }> {
  return state.status === "success"
}

/**
 * Type predicate for error state
 */
export function isErrorState<T>(
  state: LoadingState<T>
): state is Extract<LoadingState<T>, { status: "error" }> {
  return state.status === "error"
}

/**
 * Assert non-nullable
 */
export function assertNonNullable<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message || "Value is null or undefined")
  }
}

/**
 * Type-safe object keys
 */
export function objectKeys<T extends Record<string, unknown>>(
  obj: T
): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[]
}

/**
 * Type-safe object entries
 */
export function objectEntries<T extends Record<string, unknown>>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}
