/**
 * Reusable Test Mocks
 *
 * Centralized mock factories for common dependencies.
 * Reduces boilerplate and ensures consistency across tests.
 *
 * @example
 * ```ts
 * import { mockPrisma, mockAuth } from '@/test/mocks'
 *
 * vi.mock('@/lib/db', () => ({ db: mockPrisma() }))
 * vi.mock('@/auth', () => ({ auth: mockAuth() }))
 * ```
 */

import type { Prisma, PrismaClient } from "@prisma/client"
import { vi } from "vitest"

/**
 * Mock Prisma Client
 *
 * Provides a mock Prisma client with all models.
 * Each model method returns a mock function.
 *
 * @example
 * ```ts
 * const prisma = mockPrisma()
 * prisma.school.findUnique.mockResolvedValue(createMockSchool())
 * ```
 */
export function mockPrisma() {
  return {
    school: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    teacher: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    class: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    attendance: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
    timetable: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    announcement: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    exam: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Add more models as needed
    $transaction: vi.fn().mockImplementation((callback) => {
      if (typeof callback === "function") {
        return callback({
          school: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
          },
          user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
          },
          // Add transaction models as needed
        })
      }
      return Promise.all(callback)
    }),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  } as unknown as PrismaClient
}

/**
 * Mock Authentication Session
 *
 * Provides a mock session object with user data.
 *
 * @example
 * ```ts
 * import { mockSession } from '@/test/mocks'
 *
 * vi.mock('@/auth', () => ({
 *   auth: vi.fn().mockResolvedValue(mockSession())
 * }))
 * ```
 */
export function mockSession(overrides?: {
  userId?: string
  email?: string
  role?: "ADMIN" | "TEACHER" | "STUDENT" | "DEVELOPER"
  schoolId?: string
  isPlatformAdmin?: boolean
}) {
  return {
    user: {
      id: overrides?.userId ?? "u1",
      email: overrides?.email ?? "test@example.com",
      role: overrides?.role ?? "ADMIN",
      schoolId: overrides?.schoolId ?? "s1",
      isPlatformAdmin: overrides?.isPlatformAdmin ?? false,
      name: "Test User",
      image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Mock Operator Authentication
 *
 * Mocks operator-specific auth functions.
 *
 * @example
 * ```ts
 * import { mockOperatorAuth } from '@/test/mocks'
 *
 * vi.mock('@/components/operator/lib/operator-auth', () => mockOperatorAuth())
 * ```
 */
export function mockOperatorAuth() {
  return {
    requireOperator: vi.fn().mockResolvedValue({
      userId: "u1",
      role: "DEVELOPER",
      isPlatformAdmin: true,
    }),
    requireNotImpersonating: vi.fn().mockResolvedValue(undefined),
    logOperatorAudit: vi.fn().mockResolvedValue(undefined),
  }
}

/**
 * Mock Tenant Context
 *
 * Mocks tenant context functions.
 *
 * @example
 * ```ts
 * import { mockTenantContext } from '@/test/mocks'
 *
 * vi.mock('@/components/platform/operator/lib/tenant', () => ({
 *   getTenantContext: mockTenantContext()
 * }))
 * ```
 */
export function mockTenantContext(overrides?: {
  schoolId?: string
  role?: "ADMIN" | "TEACHER" | "STUDENT"
  userId?: string
}) {
  return vi.fn().mockResolvedValue({
    schoolId: overrides?.schoolId ?? "s1",
    role: overrides?.role ?? "ADMIN",
    userId: overrides?.userId ?? "u1",
  })
}

/**
 * Mock Next.js Headers
 *
 * Mocks Next.js headers() function.
 *
 * @example
 * ```ts
 * import { mockNextHeaders } from '@/test/mocks'
 *
 * vi.mock('next/headers', () => ({
 *   headers: mockNextHeaders({ host: 'school.databayt.org' })
 * }))
 * ```
 */
export function mockNextHeaders(headers: Record<string, string> = {}) {
  return vi.fn(() => ({
    get: vi.fn((key: string) => headers[key] ?? null),
    has: vi.fn((key: string) => key in headers),
    entries: vi.fn(() => Object.entries(headers)),
  }))
}

/**
 * Mock Next.js Cookies
 *
 * Mocks Next.js cookies() function.
 *
 * @example
 * ```ts
 * import { mockNextCookies } from '@/test/mocks'
 *
 * vi.mock('next/headers', () => ({
 *   cookies: mockNextCookies({ locale: 'en' })
 * }))
 * ```
 */
export function mockNextCookies(initialCookies: Record<string, string> = {}) {
  const cookieStore = { ...initialCookies }

  return vi.fn(() => ({
    get: vi.fn((key: string) => ({
      name: key,
      value: cookieStore[key] ?? "",
    })),
    set: vi.fn((key: string, value: string) => {
      cookieStore[key] = value
    }),
    delete: vi.fn((key: string) => {
      delete cookieStore[key]
    }),
    has: vi.fn((key: string) => key in cookieStore),
  }))
}

/**
 * Mock Next.js Cache Functions
 *
 * Mocks Next.js revalidatePath and revalidateTag functions.
 *
 * @example
 * ```ts
 * import { mockNextCache } from '@/test/mocks'
 *
 * vi.mock('next/cache', () => mockNextCache())
 * ```
 */
export function mockNextCache() {
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn((fn) => fn),
  }
}

/**
 * Mock Next.js Redirect
 *
 * Mocks Next.js redirect function.
 * Throws a special error that can be caught in tests.
 *
 * @example
 * ```ts
 * import { mockNextRedirect } from '@/test/mocks'
 *
 * vi.mock('next/navigation', () => ({
 *   redirect: mockNextRedirect()
 * }))
 *
 * // In test:
 * try {
 *   await myAction()
 * } catch (error) {
 *   expect(error.message).toContain('NEXT_REDIRECT')
 * }
 * ```
 */
export function mockNextRedirect() {
  return vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT: ${url}`)
    ;(error as any).digest = `NEXT_REDIRECT;${url}`
    throw error
  })
}

/**
 * Complete Next.js Mock Setup
 *
 * Combines all Next.js mocks into one object.
 * Useful for setting up all Next.js mocks at once.
 *
 * @example
 * ```ts
 * import { setupNextMocks } from '@/test/mocks'
 *
 * beforeEach(() => {
 *   setupNextMocks()
 * })
 * ```
 */
export function setupNextMocks() {
  vi.mock("next/headers", () => ({
    headers: mockNextHeaders(),
    cookies: mockNextCookies(),
  }))

  vi.mock("next/cache", () => mockNextCache())

  vi.mock("next/navigation", () => ({
    redirect: mockNextRedirect(),
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    })),
    usePathname: vi.fn(() => "/"),
    useSearchParams: vi.fn(() => new URLSearchParams()),
  }))
}

// ============================================================================
// AUTH-SPECIFIC MOCKS
// ============================================================================

/**
 * Mock bcrypt functions
 *
 * Mocks bcryptjs hash and compare functions for password testing.
 *
 * @example
 * ```ts
 * import { mockBcrypt } from '@/test/mocks'
 *
 * vi.mock('bcryptjs', () => mockBcrypt())
 *
 * // Override specific behavior:
 * vi.mock('bcryptjs', () => mockBcrypt({ compareResult: false }))
 * ```
 */
export function mockBcrypt(options?: {
  hashResult?: string
  compareResult?: boolean
}) {
  return {
    hash: vi.fn().mockResolvedValue(options?.hashResult ?? "$2a$10$mockedHash"),
    compare: vi.fn().mockResolvedValue(options?.compareResult ?? true),
    hashSync: vi
      .fn()
      .mockReturnValue(options?.hashResult ?? "$2a$10$mockedHash"),
    compareSync: vi.fn().mockReturnValue(options?.compareResult ?? true),
  }
}

/**
 * Mock NextAuth signIn function
 *
 * Mocks the NextAuth signIn function for testing login flows.
 *
 * @example
 * ```ts
 * import { mockSignIn } from '@/test/mocks'
 *
 * vi.mock('next-auth/react', () => ({
 *   signIn: mockSignIn()
 * }))
 *
 * // Test error scenarios:
 * vi.mock('next-auth/react', () => ({
 *   signIn: mockSignIn({ error: 'CredentialsSignin' })
 * }))
 * ```
 */
export function mockSignIn(options?: {
  error?: string
  url?: string
  ok?: boolean
}) {
  return vi.fn().mockResolvedValue({
    error: options?.error ?? null,
    url: options?.url ?? "/dashboard",
    ok: options?.ok ?? true,
    status: options?.error ? 401 : 200,
  })
}

/**
 * Mock NextAuth signOut function
 *
 * Mocks the NextAuth signOut function for testing logout flows.
 *
 * @example
 * ```ts
 * import { mockSignOut } from '@/test/mocks'
 *
 * vi.mock('next-auth/react', () => ({
 *   signOut: mockSignOut()
 * }))
 * ```
 */
export function mockSignOut() {
  return vi.fn().mockResolvedValue({ url: "/login" })
}

/**
 * Mock Resend email service
 *
 * Mocks the Resend email service for testing email flows.
 *
 * @example
 * ```ts
 * import { mockResend } from '@/test/mocks'
 *
 * vi.mock('resend', () => ({
 *   Resend: vi.fn().mockImplementation(() => mockResend())
 * }))
 *
 * // Test error scenarios:
 * vi.mock('resend', () => ({
 *   Resend: vi.fn().mockImplementation(() => mockResend({ error: true }))
 * }))
 * ```
 */
export function mockResend(options?: {
  error?: boolean
  errorMessage?: string
}) {
  if (options?.error) {
    return {
      emails: {
        send: vi.fn().mockResolvedValue({
          data: null,
          error: { message: options.errorMessage ?? "Failed to send email" },
        }),
      },
    }
  }

  return {
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: "mock-email-id" },
        error: null,
      }),
    },
  }
}

/**
 * Mock auth-related email functions
 *
 * Mocks the email functions used in authentication flows.
 *
 * @example
 * ```ts
 * import { mockAuthMail } from '@/test/mocks'
 *
 * vi.mock('@/components/auth/mail', () => mockAuthMail())
 * ```
 */
export function mockAuthMail() {
  return {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendTwoFactorTokenEmail: vi.fn().mockResolvedValue(undefined),
  }
}

/**
 * Mock auth-related Prisma models
 *
 * Extends mockPrisma with auth-specific models.
 * Includes: verificationToken, passwordResetToken, twoFactorToken,
 * twoFactorConfirmation, account
 *
 * @example
 * ```ts
 * import { mockPrismaAuth } from '@/test/mocks'
 *
 * vi.mock('@/lib/db', () => ({ db: mockPrismaAuth() }))
 *
 * // Setup specific token behavior:
 * const db = mockPrismaAuth()
 * db.verificationToken.findFirst.mockResolvedValue({
 *   id: 'vt1',
 *   email: 'test@example.com',
 *   token: 'mock-token',
 *   expires: new Date(Date.now() + 3600000)
 * })
 * ```
 */
export function mockPrismaAuth() {
  const basePrisma = mockPrisma()

  return {
    ...basePrisma,
    // Auth-specific models
    verificationToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    twoFactorToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    twoFactorConfirmation: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient
}

/**
 * Create mock user for auth tests
 *
 * Factory function to create mock user objects with auth-related fields.
 *
 * @example
 * ```ts
 * import { createMockUser } from '@/test/mocks'
 *
 * const user = createMockUser({ email: 'custom@example.com' })
 * db.user.findUnique.mockResolvedValue(user)
 * ```
 */
export function createMockUser(overrides?: {
  id?: string
  email?: string
  emailVerified?: Date | null
  password?: string | null
  role?:
    | "ADMIN"
    | "TEACHER"
    | "STUDENT"
    | "DEVELOPER"
    | "USER"
    | "GUARDIAN"
    | "ACCOUNTANT"
    | "STAFF"
  schoolId?: string | null
  isTwoFactorEnabled?: boolean
  image?: string | null
  username?: string | null
}) {
  return {
    id: overrides?.id ?? "user-1",
    email: overrides?.email ?? "test@example.com",
    emailVerified: overrides?.emailVerified ?? new Date(),
    password: overrides?.password ?? "$2a$10$hashedPassword",
    role: overrides?.role ?? "USER",
    schoolId: overrides?.schoolId ?? "school-1",
    isTwoFactorEnabled: overrides?.isTwoFactorEnabled ?? false,
    image: overrides?.image ?? null,
    username: overrides?.username ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create mock verification token
 *
 * Factory function to create mock verification tokens.
 *
 * @example
 * ```ts
 * import { createMockVerificationToken } from '@/test/mocks'
 *
 * const token = createMockVerificationToken({ expired: true })
 * db.verificationToken.findFirst.mockResolvedValue(token)
 * ```
 */
export function createMockVerificationToken(overrides?: {
  id?: string
  email?: string
  token?: string
  expired?: boolean
}) {
  const expires = overrides?.expired
    ? new Date(Date.now() - 3600000) // 1 hour ago
    : new Date(Date.now() + 3600000) // 1 hour from now

  return {
    id: overrides?.id ?? "vt-1",
    email: overrides?.email ?? "test@example.com",
    token: overrides?.token ?? "mock-verification-token",
    expires,
  }
}

/**
 * Create mock password reset token
 *
 * Factory function to create mock password reset tokens.
 *
 * @example
 * ```ts
 * import { createMockPasswordResetToken } from '@/test/mocks'
 *
 * const token = createMockPasswordResetToken()
 * db.passwordResetToken.findFirst.mockResolvedValue(token)
 * ```
 */
export function createMockPasswordResetToken(overrides?: {
  id?: string
  email?: string
  token?: string
  expired?: boolean
}) {
  const expires = overrides?.expired
    ? new Date(Date.now() - 3600000)
    : new Date(Date.now() + 3600000)

  return {
    id: overrides?.id ?? "prt-1",
    email: overrides?.email ?? "test@example.com",
    token: overrides?.token ?? "mock-reset-token",
    expires,
  }
}

/**
 * Create mock two-factor token
 *
 * Factory function to create mock 2FA tokens.
 *
 * @example
 * ```ts
 * import { createMockTwoFactorToken } from '@/test/mocks'
 *
 * const token = createMockTwoFactorToken({ token: '123456' })
 * db.twoFactorToken.findFirst.mockResolvedValue(token)
 * ```
 */
export function createMockTwoFactorToken(overrides?: {
  id?: string
  email?: string
  token?: string
  expired?: boolean
}) {
  const expires = overrides?.expired
    ? new Date(Date.now() - 300000) // 5 minutes ago
    : new Date(Date.now() + 300000) // 5 minutes from now

  return {
    id: overrides?.id ?? "2fa-1",
    email: overrides?.email ?? "test@example.com",
    token: overrides?.token ?? "123456",
    expires,
  }
}

/**
 * Create mock account (OAuth provider)
 *
 * Factory function to create mock OAuth accounts.
 *
 * @example
 * ```ts
 * import { createMockAccount } from '@/test/mocks'
 *
 * const account = createMockAccount({ provider: 'google' })
 * db.account.findFirst.mockResolvedValue(account)
 * ```
 */
export function createMockAccount(overrides?: {
  id?: string
  userId?: string
  type?: string
  provider?: "google" | "facebook" | "credentials"
  providerAccountId?: string
}) {
  return {
    id: overrides?.id ?? "acc-1",
    userId: overrides?.userId ?? "user-1",
    type: overrides?.type ?? "oauth",
    provider: overrides?.provider ?? "google",
    providerAccountId: overrides?.providerAccountId ?? "google-account-id",
    refresh_token: null,
    access_token: "mock-access-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "Bearer",
    scope: "openid email profile",
    id_token: null,
    session_state: null,
  }
}

/**
 * Create mock school
 *
 * Factory function to create mock school objects.
 *
 * @example
 * ```ts
 * import { createMockSchool } from '@/test/mocks'
 *
 * const school = createMockSchool({ name: 'Hogwarts' })
 * db.school.findUnique.mockResolvedValue(school)
 * ```
 */
export function createMockSchool(overrides?: {
  id?: string
  name?: string
  domain?: string
  address?: string
  website?: string
  planType?: string
}) {
  return {
    id: overrides?.id ?? "school-1",
    name: overrides?.name ?? "Test School",
    domain: overrides?.domain ?? "testschool",
    address: overrides?.address ?? "123 Test St",
    website: overrides?.website ?? null,
    planType: overrides?.planType ?? "basic",
    maxStudents: 100,
    maxTeachers: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Complete Auth Mock Setup
 *
 * Combines all auth-related mocks into a setup function.
 * Useful for setting up all auth mocks at once.
 *
 * @example
 * ```ts
 * import { setupAuthMocks } from '@/test/mocks'
 *
 * beforeEach(() => {
 *   setupAuthMocks()
 * })
 * ```
 */
export function setupAuthMocks() {
  vi.mock("bcryptjs", () => mockBcrypt())

  vi.mock("next-auth/react", () => ({
    signIn: mockSignIn(),
    signOut: mockSignOut(),
    useSession: vi.fn(() => ({
      data: mockSession(),
      status: "authenticated",
    })),
  }))

  vi.mock("@/components/auth/mail", () => mockAuthMail())

  vi.mock("@/lib/db", () => ({ db: mockPrismaAuth() }))
}

/**
 * Mock Auth.js (NextAuth v5) server-side functions
 *
 * Mocks the server-side auth functions from @/auth.
 *
 * @example
 * ```ts
 * import { mockAuthServer } from '@/test/mocks'
 *
 * vi.mock('@/auth', () => mockAuthServer())
 *
 * // Or with custom session:
 * vi.mock('@/auth', () => mockAuthServer({
 *   session: { user: { role: 'ADMIN', schoolId: 'school-1' } }
 * }))
 * ```
 */
export function mockAuthServer(options?: {
  session?: ReturnType<typeof mockSession> | null
}) {
  return {
    auth: vi.fn().mockResolvedValue(options?.session ?? mockSession()),
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
    handlers: {
      GET: vi.fn(),
      POST: vi.fn(),
    },
  }
}
