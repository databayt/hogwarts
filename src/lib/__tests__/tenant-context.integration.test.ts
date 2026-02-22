/**
 * Integration Tests: Tenant Context Resolution
 *
 * Verifies subdomain-to-schoolId resolution, caching behavior,
 * impersonation overrides, and session fallback against a real database.
 *
 * Run: pnpm vitest --config vitest.config.integration.mts --run src/lib/__tests__/tenant-context.integration.test.ts
 */

import "@/test/integration/setup"

// Import after mocks are set up
import { auth } from "@/auth"
import { cleanupTestData, createTestSchool } from "@/test/integration/helpers"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ---------------------------------------------------------------------------
// Mocks - must be declared before importing the module under test
// ---------------------------------------------------------------------------

const mockHeadersGet = vi.fn<(name: string) => string | null>()
const mockCookiesGet = vi.fn<(name: string) => { value: string } | undefined>()

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("server-only", () => ({}))

// ---------------------------------------------------------------------------
// Access the module-level in-memory cache so we can clear it between tests.
// We use a dynamic import trick: the cache is a Map on the module scope.
// Since we cannot import it directly, we reset by calling getTenantContext
// with a unique subdomain each time, or we clear via module internals.
// For reliable isolation we clear the cache by importing the module and
// accessing its internals through the module system.
// ---------------------------------------------------------------------------

/**
 * Clears the in-memory subdomain cache between tests.
 * The cache is a module-level `Map` inside tenant-context.ts.
 * Because Vitest reuses the module across tests in the same file,
 * we need to invalidate entries to prevent cross-test pollution.
 *
 * Strategy: We use unique domains per test, so cache pollution is minimal.
 * For tests that specifically verify caching we intentionally reuse domains.
 */

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

let testSchool: Awaited<ReturnType<typeof createTestSchool>>
let secondSchool: Awaited<ReturnType<typeof createTestSchool>>

const mockedAuth = vi.mocked(auth)

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  testSchool = await createTestSchool({
    name: "Tenant Context Test School",
    domain: `tc-test-${Date.now()}`,
  })

  secondSchool = await createTestSchool({
    name: "Second Test School",
    domain: `tc-second-${Date.now()}`,
  })
})

afterAll(async () => {
  await cleanupTestData(testSchool.id)
  await cleanupTestData(secondSchool.id)
})

beforeEach(() => {
  vi.clearAllMocks()

  // Default: no cookies, no headers, no session
  mockHeadersGet.mockReturnValue(null)
  mockCookiesGet.mockReturnValue(undefined)
  mockedAuth.mockResolvedValue(null)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getTenantContext - integration", () => {
  // -----------------------------------------------------------------------
  // 1. Database resolution via x-subdomain header
  // -----------------------------------------------------------------------
  describe("database resolution", () => {
    it("resolves a known subdomain to the correct schoolId", async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return testSchool.domain
        return null
      })

      const ctx = await getTenantContext()

      expect(ctx.schoolId).toBe(testSchool.id)
      expect(ctx.isPlatformAdmin).toBe(false)
      expect(ctx.role).toBeNull()
    })

    it("resolves different subdomains to different schoolIds", async () => {
      // First call with testSchool domain
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return testSchool.domain
        return null
      })
      const ctx1 = await getTenantContext()

      // Second call with secondSchool domain
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return secondSchool.domain
        return null
      })
      const ctx2 = await getTenantContext()

      expect(ctx1.schoolId).toBe(testSchool.id)
      expect(ctx2.schoolId).toBe(secondSchool.id)
      expect(ctx1.schoolId).not.toBe(ctx2.schoolId)
    })
  })

  // -----------------------------------------------------------------------
  // 2. Non-existent subdomain
  // -----------------------------------------------------------------------
  describe("non-existent subdomain", () => {
    it("returns schoolId: null for an unknown subdomain", async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return "nonexistent-school-xyz-99999"
        return null
      })

      const ctx = await getTenantContext()

      expect(ctx.schoolId).toBeNull()
      expect(ctx.role).toBeNull()
      expect(ctx.isPlatformAdmin).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // 3. In-memory cache behavior
  // -----------------------------------------------------------------------
  describe("in-memory cache", () => {
    it("uses cached value on second call, reducing DB queries", async () => {
      // Use a unique domain so previous tests don't pollute the cache
      const cacheTestSchool = await createTestSchool({
        name: "Cache Test School",
        domain: `cache-test-${Date.now()}`,
      })

      const dbSpy = vi.spyOn(db.school, "findUnique")

      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return cacheTestSchool.domain
        return null
      })

      // First call - should hit the database
      const ctx1 = await getTenantContext()
      expect(ctx1.schoolId).toBe(cacheTestSchool.id)

      const callCountAfterFirst = dbSpy.mock.calls.filter(
        (call) => (call[0] as any)?.where?.domain === cacheTestSchool.domain
      ).length

      // Second call - should use in-memory cache (no additional DB call)
      const ctx2 = await getTenantContext()
      expect(ctx2.schoolId).toBe(cacheTestSchool.id)

      const callCountAfterSecond = dbSpy.mock.calls.filter(
        (call) => (call[0] as any)?.where?.domain === cacheTestSchool.domain
      ).length

      // The second call should NOT have triggered an additional DB lookup
      expect(callCountAfterSecond).toBe(callCountAfterFirst)

      // Cleanup
      dbSpy.mockRestore()
      await cleanupTestData(cacheTestSchool.id)
    })

    it("caches null results for non-existent subdomains", async () => {
      const fakeDomain = `no-exist-cache-${Date.now()}`
      const dbSpy = vi.spyOn(db.school, "findUnique")

      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return fakeDomain
        return null
      })

      // First call - DB lookup, finds nothing
      const ctx1 = await getTenantContext()
      expect(ctx1.schoolId).toBeNull()

      const callCountAfterFirst = dbSpy.mock.calls.filter(
        (call) => (call[0] as any)?.where?.domain === fakeDomain
      ).length

      // Second call - should use cached null
      const ctx2 = await getTenantContext()
      expect(ctx2.schoolId).toBeNull()

      const callCountAfterSecond = dbSpy.mock.calls.filter(
        (call) => (call[0] as any)?.where?.domain === fakeDomain
      ).length

      expect(callCountAfterSecond).toBe(callCountAfterFirst)

      dbSpy.mockRestore()
    })
  })

  // -----------------------------------------------------------------------
  // 4. Impersonation override
  // -----------------------------------------------------------------------
  describe("impersonation override", () => {
    it("uses impersonated schoolId over header-based resolution", async () => {
      // Set up impersonation cookie
      mockCookiesGet.mockImplementation((name: string) => {
        if (name === "impersonate_schoolId") {
          return { value: secondSchool.id }
        }
        return undefined
      })

      // Set up subdomain header pointing to testSchool
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return testSchool.domain
        return null
      })

      // Auth returns a DEVELOPER user (required for impersonation)
      mockedAuth.mockResolvedValue({
        user: {
          id: "developer-1",
          email: "dev@databayt.org",
          role: "DEVELOPER",
          schoolId: null,
        },
      } as any)

      const ctx = await getTenantContext()

      // Impersonation (secondSchool) takes priority over header (testSchool)
      expect(ctx.schoolId).toBe(secondSchool.id)
      expect(ctx.role).toBe("DEVELOPER")
      expect(ctx.isPlatformAdmin).toBe(true)
    })

    it("uses impersonated schoolId over session schoolId", async () => {
      const impersonatedId = secondSchool.id

      mockCookiesGet.mockImplementation((name: string) => {
        if (name === "impersonate_schoolId") {
          return { value: impersonatedId }
        }
        return undefined
      })

      // No subdomain header
      mockHeadersGet.mockReturnValue(null)

      // Session has a different schoolId
      mockedAuth.mockResolvedValue({
        user: {
          id: "developer-2",
          email: "dev2@databayt.org",
          role: "DEVELOPER",
          schoolId: testSchool.id,
        },
      } as any)

      const ctx = await getTenantContext()

      expect(ctx.schoolId).toBe(impersonatedId)
    })
  })

  // -----------------------------------------------------------------------
  // 5. Session fallback
  // -----------------------------------------------------------------------
  describe("session fallback", () => {
    it("falls back to session schoolId when no header or cookie", async () => {
      // No subdomain header, no impersonation cookie
      mockHeadersGet.mockReturnValue(null)
      mockCookiesGet.mockReturnValue(undefined)

      mockedAuth.mockResolvedValue({
        user: {
          id: "admin-1",
          email: "admin@school.com",
          role: "ADMIN",
          schoolId: testSchool.id,
        },
      } as any)

      const ctx = await getTenantContext()

      expect(ctx.schoolId).toBe(testSchool.id)
      expect(ctx.role).toBe("ADMIN")
      expect(ctx.isPlatformAdmin).toBe(false)
    })

    it("returns null schoolId when no resolution source available", async () => {
      mockHeadersGet.mockReturnValue(null)
      mockCookiesGet.mockReturnValue(undefined)
      mockedAuth.mockResolvedValue(null)

      const ctx = await getTenantContext()

      expect(ctx.schoolId).toBeNull()
      expect(ctx.role).toBeNull()
      expect(ctx.isPlatformAdmin).toBe(false)
    })

    it("returns null schoolId when session user has no schoolId", async () => {
      mockHeadersGet.mockReturnValue(null)
      mockCookiesGet.mockReturnValue(undefined)

      mockedAuth.mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@databayt.org",
          role: "USER",
          schoolId: null,
        },
      } as any)

      const ctx = await getTenantContext()

      expect(ctx.schoolId).toBeNull()
      expect(ctx.role).toBe("USER")
    })
  })

  // -----------------------------------------------------------------------
  // 6. isPlatformAdmin
  // -----------------------------------------------------------------------
  describe("isPlatformAdmin", () => {
    it("returns true for DEVELOPER role", async () => {
      mockedAuth.mockResolvedValue({
        user: {
          id: "dev-1",
          email: "dev@databayt.org",
          role: "DEVELOPER",
          schoolId: null,
        },
      } as any)

      const ctx = await getTenantContext()

      expect(ctx.isPlatformAdmin).toBe(true)
      expect(ctx.role).toBe("DEVELOPER")
    })

    it("returns false for ADMIN role", async () => {
      mockedAuth.mockResolvedValue({
        user: {
          id: "admin-1",
          email: "admin@school.com",
          role: "ADMIN",
          schoolId: testSchool.id,
        },
      } as any)

      const ctx = await getTenantContext()

      expect(ctx.isPlatformAdmin).toBe(false)
      expect(ctx.role).toBe("ADMIN")
    })

    it("returns false for TEACHER role", async () => {
      mockedAuth.mockResolvedValue({
        user: {
          id: "teacher-1",
          email: "teacher@school.com",
          role: "TEACHER",
          schoolId: testSchool.id,
        },
      } as any)

      const ctx = await getTenantContext()

      expect(ctx.isPlatformAdmin).toBe(false)
      expect(ctx.role).toBe("TEACHER")
    })

    it("returns false for STUDENT role", async () => {
      mockedAuth.mockResolvedValue({
        user: {
          id: "student-1",
          email: "student@school.com",
          role: "STUDENT",
          schoolId: testSchool.id,
        },
      } as any)

      const ctx = await getTenantContext()

      expect(ctx.isPlatformAdmin).toBe(false)
      expect(ctx.role).toBe("STUDENT")
    })

    it("returns false when no session exists", async () => {
      mockedAuth.mockResolvedValue(null)

      const ctx = await getTenantContext()

      expect(ctx.isPlatformAdmin).toBe(false)
      expect(ctx.role).toBeNull()
    })
  })

  // -----------------------------------------------------------------------
  // 7. requestId resolution
  // -----------------------------------------------------------------------
  describe("requestId", () => {
    it("uses x-vercel-id header when available", async () => {
      const vercelId = "iad1::abcde-1234"

      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-vercel-id") return vercelId
        return null
      })

      const ctx = await getTenantContext()

      expect(ctx.requestId).toBe(vercelId)
    })

    it("falls back to x-request-id header", async () => {
      const requestId = "custom-request-id-5678"

      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-request-id") return requestId
        return null
      })

      const ctx = await getTenantContext()

      expect(ctx.requestId).toBe(requestId)
    })

    it("generates a UUID when no request ID headers present", async () => {
      mockHeadersGet.mockReturnValue(null)

      const ctx = await getTenantContext()

      // Should be a valid UUID format
      expect(ctx.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it("prefers x-vercel-id over x-request-id", async () => {
      const vercelId = "iad1::priority-id"
      const requestId = "fallback-id"

      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-vercel-id") return vercelId
        if (name === "x-request-id") return requestId
        return null
      })

      const ctx = await getTenantContext()

      expect(ctx.requestId).toBe(vercelId)
    })
  })

  // -----------------------------------------------------------------------
  // 8. Resolution priority order
  // -----------------------------------------------------------------------
  describe("resolution priority", () => {
    it("impersonation > header > session (all three present)", async () => {
      const impersonatedId = "impersonated-school-id"

      // All three sources set
      mockCookiesGet.mockImplementation((name: string) => {
        if (name === "impersonate_schoolId") {
          return { value: impersonatedId }
        }
        return undefined
      })

      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return testSchool.domain
        return null
      })

      mockedAuth.mockResolvedValue({
        user: {
          id: "dev-1",
          email: "dev@databayt.org",
          role: "DEVELOPER",
          schoolId: secondSchool.id,
        },
      } as any)

      const ctx = await getTenantContext()

      // Impersonation wins
      expect(ctx.schoolId).toBe(impersonatedId)
    })

    it("header > session (no impersonation)", async () => {
      // No impersonation cookie
      mockCookiesGet.mockReturnValue(undefined)

      mockHeadersGet.mockImplementation((name: string) => {
        if (name === "x-subdomain") return testSchool.domain
        return null
      })

      mockedAuth.mockResolvedValue({
        user: {
          id: "admin-1",
          email: "admin@school.com",
          role: "ADMIN",
          schoolId: secondSchool.id,
        },
      } as any)

      const ctx = await getTenantContext()

      // Header-resolved schoolId wins over session
      expect(ctx.schoolId).toBe(testSchool.id)
    })
  })

  // -----------------------------------------------------------------------
  // 9. Error resilience
  // -----------------------------------------------------------------------
  describe("error resilience", () => {
    it("returns safe defaults when auth() throws", async () => {
      mockedAuth.mockRejectedValue(new Error("Auth service unavailable"))

      const ctx = await getTenantContext()

      expect(ctx.schoolId).toBeNull()
      expect(ctx.role).toBeNull()
      expect(ctx.isPlatformAdmin).toBe(false)
      expect(ctx.requestId).toBeNull()
    })
  })
})
