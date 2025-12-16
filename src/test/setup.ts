/**
 * Global Test Setup
 *
 * This file configures global test behavior for all Vitest tests.
 * It's automatically loaded before test execution.
 *
 * @see https://vitest.dev/config/#setupfiles
 */

import { cleanup } from "@testing-library/react"
import { afterEach, beforeAll, expect, vi } from "vitest"

/**
 * Mock environment variables for tests
 * This prevents env.mjs from failing due to missing vars
 */
vi.mock("@/env.mjs", () => ({
  env: {
    // Required environment variables
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "test-secret",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    AUTH_GOOGLE_ID: "test-google-id",
    AUTH_GOOGLE_SECRET: "test-google-secret",
    AUTH_FACEBOOK_ID: "test-facebook-id",
    AUTH_FACEBOOK_SECRET: "test-facebook-secret",
    NODE_ENV: "test",
    // Optional vars
    SENTRY_DSN: undefined,
    STRIPE_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
    RESEND_API_KEY: undefined,
  },
}))

/**
 * Mock server-only module (imported by tenant-context.ts)
 */
vi.mock("server-only", () => ({}))

/**
 * Mock auth module for tests
 */
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      role: "ADMIN",
      schoolId: "test-school-id",
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

/**
 * Cleanup after each test
 * - Unmounts React components
 * - Clears all mocks
 * - Resets module registry
 */
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

/**
 * Global test configuration
 */
beforeAll(() => {
  // Suppress console errors in tests (optional)
  // Uncomment if you want cleaner test output
  // vi.spyOn(console, 'error').mockImplementation(() => {})
})

/**
 * Custom Vitest matchers (optional)
 * Add custom matchers here if needed
 *
 * Example:
 * expect.extend({
 *   toBeValidSchoolId(received) {
 *     const pass = typeof received === 'string' && received.startsWith('s')
 *     return {
 *       pass,
 *       message: () => `Expected ${received} to be a valid schoolId (starts with 's')`
 *     }
 *   }
 * })
 */

/**
 * Global test helpers
 */

/**
 * Wait for async operations to complete
 * Useful for testing debounced functions or async state updates
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Flush all pending promises
 * Useful for testing microtask queue
 */
export const flushPromises = () =>
  new Promise((resolve) => setImmediate(resolve))
