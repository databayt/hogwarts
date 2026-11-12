// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The tenant boundary, without a database: who may receive which school.
 *
 * The session cookie is shared by every school subdomain, so a request can
 * carry school A's admin and school B's host at once. These cases pin what
 * the context answers then, and who the two plain cookies (impersonation,
 * preview) are honoured for.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const headerValues = new Map<string, string>()
const cookieValues = new Map<string, string>()
const SCHOOLS: Record<string, string> = { alpha: "school-a", beta: "school-b" }

vi.mock("server-only", () => ({}))
vi.mock("react", async (orig) => ({
  ...(await orig<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}))
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => headerValues.get(name) ?? null,
  })),
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieValues.has(name) ? { value: cookieValues.get(name)! } : undefined,
  })),
}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/circuit-breaker", () => ({
  dbCircuitBreaker: { execute: (fn: () => unknown) => fn() },
}))
vi.mock("@/lib/db", () => ({
  db: {
    school: {
      findUnique: vi.fn(async ({ where }: { where: { domain: string } }) =>
        SCHOOLS[where.domain] ? { id: SCHOOLS[where.domain] } : null
      ),
    },
  },
}))

import { auth } from "@/auth"

import { getHostSchoolId, getTenantContext } from "@/lib/tenant-context"

const signIn = (user: Record<string, unknown> | null) =>
  vi.mocked(auth).mockResolvedValue((user ? { user } : null) as never)

describe("tenant boundary", () => {
  beforeEach(() => {
    headerValues.clear()
    cookieValues.clear()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it("gives a school's admin their own school on their own host", async () => {
    headerValues.set("x-subdomain", "alpha")
    signIn({ id: "u1", role: "ADMIN", schoolId: "school-a" })
    expect((await getTenantContext()).schoolId).toBe("school-a")
  })

  it("gives another school's admin no school at all", async () => {
    headerValues.set("x-subdomain", "beta")
    signIn({ id: "u1", role: "ADMIN", schoolId: "school-a" })
    expect((await getTenantContext()).schoolId).toBeNull()
  })

  it.each(["TEACHER", "STUDENT", "GUARDIAN", "STAFF", "ACCOUNTANT"])(
    "holds for %s too",
    async (role) => {
      headerValues.set("x-subdomain", "beta")
      signIn({ id: "u1", role, schoolId: "school-a" })
      expect((await getTenantContext()).schoolId).toBeNull()
    }
  )

  it("lets a DEVELOPER follow the host", async () => {
    headerValues.set("x-subdomain", "beta")
    signIn({ id: "dev", role: "DEVELOPER", schoolId: null })
    expect((await getTenantContext()).schoolId).toBe("school-b")
  })

  it("still names the host's school for a visitor and a school-less account", async () => {
    headerValues.set("x-subdomain", "beta")
    signIn(null)
    expect((await getTenantContext()).schoolId).toBe("school-b")
    signIn({ id: "applicant", role: "USER", schoolId: null })
    expect((await getTenantContext()).schoolId).toBe("school-b")
  })

  it("ignores the impersonation cookie for everyone but a DEVELOPER", async () => {
    cookieValues.set("impersonate_schoolId", "school-b")
    headerValues.set("x-subdomain", "alpha")

    signIn({ id: "u1", role: "ADMIN", schoolId: "school-a" })
    expect((await getTenantContext()).schoolId).toBe("school-a")

    signIn(null)
    expect((await getTenantContext()).schoolId).toBe("school-a")

    signIn({ id: "dev", role: "DEVELOPER", schoolId: null })
    expect((await getTenantContext()).schoolId).toBe("school-b")
  })

  it("keeps a DEVELOPER's impersonation while previewing a role", async () => {
    cookieValues.set("impersonate_schoolId", "school-b")
    signIn({ id: "dev", role: "ADMIN", schoolId: null, isPreviewMode: true })
    expect((await getTenantContext()).schoolId).toBe("school-b")
  })

  it("getHostSchoolId names the host's school whoever is signed in", async () => {
    headerValues.set("x-subdomain", "beta")
    signIn({ id: "u1", role: "ADMIN", schoolId: "school-a" })
    expect(await getHostSchoolId()).toBe("school-b")
    headerValues.clear()
    expect(await getHostSchoolId()).toBeNull()
  })
})
