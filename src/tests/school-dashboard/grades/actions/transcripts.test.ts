// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  generateTranscript,
  getTranscripts,
  verifyTranscript,
} from "@/components/school-dashboard/grades/actions/transcripts"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    reportCard: { findMany: vi.fn() },
    transcript: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: vi.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: { PUBLIC: { windowMs: 60000, maxRequests: 30 } },
}))

const SCHOOL = "school-1"

function asAdmin(schoolId: string | null = SCHOOL) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role: "ADMIN", schoolId },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  asAdmin(SCHOOL)
})

describe("generateTranscript", () => {
  it("rejects without a school context", async () => {
    asAdmin(null)
    const r = await generateTranscript({ studentId: "stu-1" })
    expect(r.success).toBe(false)
  })

  it("404s when the student is not in the caller's school", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue(null)
    const r = await generateTranscript({ studentId: "stu-x" })
    expect(r.success).toBe(false)
    const where = vi.mocked(db.student.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      id: "stu-x",
      schoolId: SCHOOL,
    })
  })

  it("fails when the student has no report cards", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-1",
      firstName: "John",
      lastName: "Smith",
    } as never)
    vi.mocked(db.reportCard.findMany).mockResolvedValue([] as never)
    const r = await generateTranscript({ studentId: "stu-1" })
    expect(r.success).toBe(false)
  })

  it("creates a transcript with frozen data, GPA and credits", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-1",
      firstName: "John",
      lastName: "Smith",
    } as never)
    vi.mocked(db.reportCard.findMany).mockResolvedValue([
      {
        overallGPA: 3.5,
        term: {
          termNumber: 1,
          schoolYear: { yearName: "2025-2026" },
        },
        grades: [
          {
            grade: "A",
            score: 90,
            maxScore: 100,
            percentage: 90,
            credits: 3,
            subject: { name: "Math" },
          },
        ],
      },
    ] as never)
    vi.mocked(db.transcript.create).mockResolvedValue({
      id: "tr-1",
    } as never)

    const r = await generateTranscript({ studentId: "stu-1" })

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.id).toBe("tr-1")
    const arg = vi.mocked(db.transcript.create).mock.calls[0][0]
    const data = (arg as { data: Record<string, unknown> }).data
    expect(data.schoolId).toBe(SCHOOL)
    expect(data.studentName).toBe("John Smith")
    expect(data.totalCredits).toBe(3)
    expect(data.transcriptNumber).toMatch(/^TR-/)
  })
})

describe("verifyTranscript", () => {
  it("is public — looks up by verificationCode only (no schoolId)", async () => {
    vi.mocked(db.transcript.findUnique).mockResolvedValue({
      transcriptNumber: "TR-1",
      studentName: "John Smith",
      cumulativeGPA: 3.5,
      totalCredits: 30,
      createdAt: new Date(),
      school: { name: "Demo School" },
    } as never)

    const r = await verifyTranscript({ verificationCode: "CODE123" })

    expect(r.valid).toBe(true)
    if (r.valid) expect(r.data?.schoolName).toBe("Demo School")
    const where = vi.mocked(db.transcript.findUnique).mock.calls[0][0]
    expect(
      (where as { where: Record<string, unknown> }).where
    ).not.toHaveProperty("schoolId")
  })

  it("returns invalid for an unknown code", async () => {
    vi.mocked(db.transcript.findUnique).mockResolvedValue(null)
    const r = await verifyTranscript({ verificationCode: "nope" })
    expect(r.valid).toBe(false)
  })
})

describe("getTranscripts", () => {
  it("scopes the listing by schoolId", async () => {
    vi.mocked(db.transcript.findMany).mockResolvedValue([] as never)
    await getTranscripts()
    const arg = vi.mocked(db.transcript.findMany).mock.calls[0][0]
    expect((arg as { where: Record<string, unknown> }).where).toMatchObject({
      schoolId: SCHOOL,
    })
  })

  it("returns [] without a school", async () => {
    asAdmin(null)
    expect(await getTranscripts()).toEqual([])
  })
})
