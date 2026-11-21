// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `GET /api/live/quick-results` — the room's Quiz-tab poll.
 *
 * It runs the exams action's own function, so these tests drive the REAL
 * action with its edges mocked and check what a caller sees: no session or no
 * school is refused, another school's assessment is simply not found, and an
 * author gets the same data the action returns.
 */
import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { GET } from "@/app/api/live/quick-results/route"

vi.mock("@/lib/db", () => ({
  db: {
    quickAssessment: { findFirst: vi.fn() },
    questionBank: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/teaching-scope", () => ({ getStudentScopes: vi.fn() }))
vi.mock("@/components/school-dashboard/teaching-scope/resolve", () => ({
  resolveTeachingScope: vi.fn(),
}))
vi.mock("@/components/school-dashboard/grades/lib/gradebook", () => ({
  resolveStudentSubjectContext: vi.fn(),
  upsertGradebookResult: vi.fn(),
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-a"
const req = (qs = "?id=qa-1") =>
  new NextRequest(`http://localhost/api/live/quick-results${qs}`)

const signedIn = (role = "TEACHER") => {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", schoolId: SCHOOL, role },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    requestId: "r",
    role,
    isPlatformAdmin: false,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/live/quick-results", () => {
  it("answers 400 without an id", async () => {
    signedIn()
    const res = await GET(req(""))
    expect(res.status).toBe(400)
    expect(db.quickAssessment.findFirst).not.toHaveBeenCalled()
  })

  it("refuses an unauthenticated request before touching the database", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      requestId: "r",
      role: null,
      isPlatformAdmin: false,
    } as never)
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(db.quickAssessment.findFirst).not.toHaveBeenCalled()
  })

  it("refuses a request with no school context", async () => {
    signedIn()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null,
      requestId: "r",
      role: "TEACHER",
      isPlatformAdmin: false,
    } as never)
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(db.quickAssessment.findFirst).not.toHaveBeenCalled()
  })

  it("refuses a student (not an author role)", async () => {
    signedIn("STUDENT")
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(db.quickAssessment.findFirst).not.toHaveBeenCalled()
  })

  it("scopes the read by the caller's school: another school's check is 404", async () => {
    signedIn()
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null as never)
    const res = await GET(req("?id=qa-of-school-b"))
    expect(res.status).toBe(404)
    expect(db.quickAssessment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "qa-of-school-b", schoolId: SCHOOL },
      })
    )
  })

  it("returns the action's results, uncached, for an author of the school", async () => {
    signedIn()
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue({
      id: "qa-1",
      title: "Pop quiz",
      questionIds: [],
      responses: [{}, {}],
    } as never)
    vi.mocked(db.questionBank.findMany).mockResolvedValue([] as never)
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("no-store")
    const body = await res.json()
    expect(body).toMatchObject({
      success: true,
      data: { assessmentId: "qa-1", title: "Pop quiz", totalResponses: 2 },
    })
  })
})
