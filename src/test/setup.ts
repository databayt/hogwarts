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
