/**
 * User/Auth Mock Factories
 *
 * Provides factory functions to create mock user, session, and auth context
 * data for testing onboarding flows.
 */

import { faker } from "@faker-js/faker"

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User roles available in the system
 */
export type UserRole =
  | "DEVELOPER"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT"
  | "STAFF"
  | "USER"

/**
 * Auth context structure for server actions
 */
export interface MockAuthContext {
  userId: string
  schoolId: string | null
  role: UserRole
  email: string
  name: string | null
  isPlatformAdmin: boolean
}

/**
 * Extended user data in session
 */
export interface MockSessionUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: UserRole
  schoolId: string | null
  isPlatformAdmin: boolean
  emailVerified: Date | null
}

/**
 * Complete session structure
 */
export interface MockSession {
  user: MockSessionUser
  expires: string
}

// ============================================================================
// Role Constants
// ============================================================================

const USER_ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
]

const SCHOOL_SCOPED_ROLES: UserRole[] = [
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
]

// ============================================================================
// Auth Context Factories
// ============================================================================

/**
 * Create a mock auth context for server action testing
 * @param overrides - Optional overrides for the auth context
 */
export function createMockAuthContext(
  overrides: Partial<MockAuthContext> = {}
): MockAuthContext {
  const role = overrides.role ?? "ADMIN"
  const isPlatformAdmin = role === "DEVELOPER"

  return {
    userId: faker.string.cuid(),
    schoolId: isPlatformAdmin ? null : faker.string.cuid(),
    role,
    email: faker.internet.email(),
    name: faker.person.fullName(),
    isPlatformAdmin,
    ...overrides,
  }
}

/**
 * Create a mock auth context for admin user
 */
export function createAdminAuthContext(
  schoolId?: string,
  overrides: Partial<MockAuthContext> = {}
): MockAuthContext {
  return createMockAuthContext({
    role: "ADMIN",
    schoolId: schoolId ?? faker.string.cuid(),
    isPlatformAdmin: false,
    ...overrides,
  })
}

/**
 * Create a mock auth context for school-dashboard developer
 */
export function createDeveloperAuthContext(
  overrides: Partial<MockAuthContext> = {}
): MockAuthContext {
  return createMockAuthContext({
    role: "DEVELOPER",
    schoolId: null,
    isPlatformAdmin: true,
    ...overrides,
  })
}

/**
 * Create a mock auth context for teacher
 */
export function createTeacherAuthContext(
  schoolId?: string,
  overrides: Partial<MockAuthContext> = {}
): MockAuthContext {
  return createMockAuthContext({
    role: "TEACHER",
    schoolId: schoolId ?? faker.string.cuid(),
    isPlatformAdmin: false,
    ...overrides,
  })
}

/**
 * Create a mock auth context for student
 */
export function createStudentAuthContext(
  schoolId?: string,
  overrides: Partial<MockAuthContext> = {}
): MockAuthContext {
  return createMockAuthContext({
    role: "STUDENT",
    schoolId: schoolId ?? faker.string.cuid(),
    isPlatformAdmin: false,
    ...overrides,
  })
}

/**
 * Create an unauthenticated context (null)
 */
export function createUnauthenticatedContext(): null {
  return null
}

// ============================================================================
// Session Factories
// ============================================================================

/**
 * Create a mock session user
 * @param overrides - Optional overrides for the session user
 */
export function createMockSessionUser(
  overrides: Partial<MockSessionUser> = {}
): MockSessionUser {
  const role = overrides.role ?? "ADMIN"
  const isPlatformAdmin = role === "DEVELOPER"

  return {
    id: faker.string.cuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    image: faker.image.avatar(),
    role,
    schoolId: isPlatformAdmin ? null : faker.string.cuid(),
    isPlatformAdmin,
    emailVerified: faker.date.past(),
    ...overrides,
  }
}

/**
 * Create a complete mock session
 * @param userOverrides - Optional overrides for the session user
 */
export function createMockSession(
  userOverrides: Partial<MockSessionUser> = {}
): MockSession {
  // Session expires 24 hours from now
  const expiresDate = new Date()
  expiresDate.setHours(expiresDate.getHours() + 24)

  return {
    user: createMockSessionUser(userOverrides),
    expires: expiresDate.toISOString(),
  }
}

/**
 * Create an admin session
 */
export function createAdminSession(
  schoolId?: string,
  overrides: Partial<MockSessionUser> = {}
): MockSession {
  return createMockSession({
    role: "ADMIN",
    schoolId: schoolId ?? faker.string.cuid(),
    isPlatformAdmin: false,
    ...overrides,
  })
}

/**
 * Create a developer session (school-dashboard admin)
 */
export function createDeveloperSession(
  overrides: Partial<MockSessionUser> = {}
): MockSession {
  return createMockSession({
    role: "DEVELOPER",
    schoolId: null,
    isPlatformAdmin: true,
    ...overrides,
  })
}

/**
 * Create an expired session
 */
export function createExpiredSession(
  userOverrides: Partial<MockSessionUser> = {}
): MockSession {
  const expiredDate = new Date()
  expiredDate.setHours(expiredDate.getHours() - 1) // Expired 1 hour ago

  return {
    user: createMockSessionUser(userOverrides),
    expires: expiredDate.toISOString(),
  }
}

/**
 * Create a session with unverified email
 */
export function createUnverifiedSession(
  userOverrides: Partial<MockSessionUser> = {}
): MockSession {
  return createMockSession({
    emailVerified: null,
    ...userOverrides,
  })
}

// ============================================================================
// Auth Mock Utilities for vi.mock
// ============================================================================

/**
 * Create a mock auth function that returns a session
 * Usage: vi.mocked(auth).mockResolvedValue(createAuthMock('ADMIN'))
 */
export function createAuthMock(role: UserRole = "ADMIN", schoolId?: string) {
  const session = createMockSession({ role, schoolId })
  return session
}

/**
 * Create auth mock factory for vi.mock setup
 * Returns a function that can be used as mockImplementation
 */
export function createAuthMockFactory(
  defaultRole: UserRole = "ADMIN",
  defaultSchoolId?: string
) {
  return () => Promise.resolve(createAuthMock(defaultRole, defaultSchoolId))
}

/**
 * Mock auth module setup helper
 * Usage in test setup:
 * vi.mock('@/auth', () => setupAuthMock('ADMIN', 'school-123'))
 */
export function setupAuthMock(role: UserRole = "ADMIN", schoolId?: string) {
  const session = createAuthMock(role, schoolId)
  return {
    auth: vi.fn().mockResolvedValue(session),
  }
}

/**
 * Mock auth for unauthorized scenarios
 */
export function setupUnauthenticatedMock() {
  return {
    auth: vi.fn().mockResolvedValue(null),
  }
}

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generate test users with various roles
 */
export function createTestUsers(schoolId: string) {
  return {
    admin: createAdminAuthContext(schoolId),
    teacher: createTeacherAuthContext(schoolId),
    student: createStudentAuthContext(schoolId),
    developer: createDeveloperAuthContext(),
    unauthenticated: null,
  }
}

/**
 * Generate test sessions with various roles
 */
export function createTestSessions(schoolId: string) {
  return {
    admin: createAdminSession(schoolId),
    developer: createDeveloperSession(),
    expired: createExpiredSession({ schoolId }),
    unverified: createUnverifiedSession({ schoolId }),
  }
}
