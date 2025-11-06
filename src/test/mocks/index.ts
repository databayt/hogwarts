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

import { vi } from 'vitest'
import type { Prisma, PrismaClient } from '@prisma/client'

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
      if (typeof callback === 'function') {
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
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'DEVELOPER'
  schoolId?: string
  isPlatformAdmin?: boolean
}) {
  return {
    user: {
      id: overrides?.userId ?? 'u1',
      email: overrides?.email ?? 'test@example.com',
      role: overrides?.role ?? 'ADMIN',
      schoolId: overrides?.schoolId ?? 's1',
      isPlatformAdmin: overrides?.isPlatformAdmin ?? false,
      name: 'Test User',
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
      userId: 'u1',
      role: 'DEVELOPER',
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
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT'
  userId?: string
}) {
  return vi.fn().mockResolvedValue({
    schoolId: overrides?.schoolId ?? 's1',
    role: overrides?.role ?? 'ADMIN',
    userId: overrides?.userId ?? 'u1',
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
      value: cookieStore[key] ?? '',
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
  vi.mock('next/headers', () => ({
    headers: mockNextHeaders(),
    cookies: mockNextCookies(),
  }))

  vi.mock('next/cache', () => mockNextCache())

  vi.mock('next/navigation', () => ({
    redirect: mockNextRedirect(),
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    })),
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
  }))
}
