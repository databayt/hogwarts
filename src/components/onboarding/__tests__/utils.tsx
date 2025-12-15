/**
 * Onboarding Test Utilities
 *
 * Provides test utilities for rendering onboarding components with required
 * providers and configuring mocks for database, auth, and navigation.
 */

import * as React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { HostValidationProvider } from '../host-validation-context'

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// ============================================================================
// Provider Wrapper
// ============================================================================

interface AllProvidersProps {
  children: React.ReactNode
  initialNextDisabled?: boolean
}

/**
 * Wrapper component that includes all providers needed for onboarding tests
 */
function AllProviders({ children, initialNextDisabled = true }: AllProvidersProps) {
  return (
    <HostValidationProvider>
      {children}
    </HostValidationProvider>
  )
}

// ============================================================================
// Custom Render Function
// ============================================================================

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial state for the next button (default: true = disabled)
   */
  initialNextDisabled?: boolean
}

/**
 * Custom render function that wraps components with HostValidationProvider
 * and other necessary providers for testing onboarding components.
 *
 * @param ui - The React element to render
 * @param options - Extended render options including provider configuration
 * @returns Render result with all testing utilities
 *
 * @example
 * ```typescript
 * import { renderWithProviders, screen } from './utils'
 *
 * it('renders the title form', () => {
 *   renderWithProviders(<TitleForm />)
 *   expect(screen.getByLabelText(/school name/i)).toBeInTheDocument()
 * })
 * ```
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { initialNextDisabled, ...options }: ExtendedRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders initialNextDisabled={initialNextDisabled}>
      {children}
    </AllProviders>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}

// ============================================================================
// Mock Setup Functions
// ============================================================================

/**
 * Setup common mocks for onboarding tests.
 * Call this in beforeEach or at the top of your test file.
 *
 * @example
 * ```typescript
 * import { setupOnboardingMocks } from './utils'
 *
 * beforeEach(() => {
 *   setupOnboardingMocks()
 * })
 * ```
 */
export function setupOnboardingMocks() {
  // Mock database
  vi.mock('@/lib/db', () => ({
    db: {
      school: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  }))

  // Mock auth
  vi.mock('@/auth', () => ({
    auth: vi.fn(),
  }))

  // Mock next/cache
  vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  }))

  // Mock next/navigation
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => '/en/host/title',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({ lang: 'en' }),
    redirect: vi.fn(),
  }))
}

/**
 * Setup mocks with custom auth session
 *
 * @param session - The mock session to return from auth()
 *
 * @example
 * ```typescript
 * import { setupOnboardingMocksWithAuth } from './utils'
 * import { createAdminSession } from './factories/user'
 *
 * beforeEach(() => {
 *   setupOnboardingMocksWithAuth(createAdminSession('school-123'))
 * })
 * ```
 */
export function setupOnboardingMocksWithAuth(session: unknown) {
  setupOnboardingMocks()

  vi.mock('@/auth', () => ({
    auth: vi.fn().mockResolvedValue(session),
  }))
}

/**
 * Create a mock for database operations
 *
 * @example
 * ```typescript
 * const dbMock = createDbMock()
 * dbMock.school.findUnique.mockResolvedValue(mockSchool)
 * ```
 */
export function createDbMock() {
  return {
    school: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  }
}

/**
 * Create mock router for testing navigation
 */
export function createRouterMock() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Wait for form submission to complete
 * Useful for async form handlers
 */
export async function waitForFormSubmission() {
  // Wait for any pending promises
  await vi.waitFor(() => {
    // This will resolve when all microtasks are complete
  })
}

/**
 * Fill form inputs with test data
 *
 * @param inputs - Object mapping label text to input values
 *
 * @example
 * ```typescript
 * await fillFormInputs({
 *   'School name': 'Test School',
 *   'Description': 'A test school description',
 * })
 * ```
 */
export async function fillFormInputs(
  inputs: Record<string, string>,
  screen: ReturnType<typeof import('@testing-library/react').screen>
) {
  const userEvent = (await import('@testing-library/user-event')).default
  const user = userEvent.setup()

  for (const [label, value] of Object.entries(inputs)) {
    const input = screen.getByLabelText(new RegExp(label, 'i'))
    await user.clear(input)
    await user.type(input, value)
  }
}

/**
 * Assert form validation error is displayed
 *
 * @param errorMessage - The error message to look for
 */
export function assertValidationError(
  errorMessage: string | RegExp,
  screen: ReturnType<typeof import('@testing-library/react').screen>
) {
  const error = screen.queryByText(errorMessage)
  expect(error).toBeInTheDocument()
}

/**
 * Assert form validation error is NOT displayed
 *
 * @param errorMessage - The error message that should not appear
 */
export function assertNoValidationError(
  errorMessage: string | RegExp,
  screen: ReturnType<typeof import('@testing-library/react').screen>
) {
  const error = screen.queryByText(errorMessage)
  expect(error).not.toBeInTheDocument()
}

// ============================================================================
// Type Exports
// ============================================================================

export type { ExtendedRenderOptions }
