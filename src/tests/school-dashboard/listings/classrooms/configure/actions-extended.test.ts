// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { generateSections } from "@/components/school-dashboard/listings/classrooms/configure/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    academicGrade: { findFirst: vi.fn() },
    section: { count: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    classroom: {
      upsert: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    classroomType: { findFirst: vi.fn(), create: vi.fn() },
    school: { findUnique: vi.fn() },
    term: { findFirst: vi.fn() },
    teacher: { findMany: vi.fn() },
    teacherSubjectExpertise: { findMany: vi.fn() },
    period: { findMany: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
    class: { findMany: vi.fn(), createMany: vi.fn() },
    department: { findFirst: vi.fn(), create: vi.fn() },
    student: { findMany: vi.fn() },
    studentClass: { createMany: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      // Default: invoke the callback with a tx proxying to db
      return cb(db as unknown)
    }),
  },
}))

const SCHOOL = "school-1"

function asAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role: "ADMIN", schoolId: SCHOOL },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
    role: "ADMIN",
    locale: "en",
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  asAdmin()
})

// ============================================================================
// generateSections — happy path + idempotency
// ============================================================================

describe("generateSections (additional cases)", () => {
  it("creates only the missing sections when some letters are already in use", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue({
      maxClasses: null, // no limit
    } as any)
    vi.mocked(db.classroom.count).mockResolvedValue(1)
    vi.mocked(db.section.count).mockResolvedValue(1)
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
      gradeNumber: 1,
    } as any)
    // 1 of 3 sections already exists (letter A)
    vi.mocked(db.section.findMany).mockResolvedValue([{ letter: "A" }] as any)
    vi.mocked(db.classroom.upsert).mockImplementation(
      async ({ create }) =>
        ({
          id: `room-${(create as any).roomName}`,
          capacity: (create as any).capacity,
        }) as any
    )
    vi.mocked(db.section.create).mockResolvedValue({} as any)

    const result = await generateSections({
      grades: [
        { gradeId: "g1", sections: 3, capacityPerSection: 30, roomType: "rt1" },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.created).toBe(2) // only B and C
      expect(result.data.details[0]).toMatch(/Grade 1: created 2 new sections/)
    }
    expect(vi.mocked(db.section.create)).toHaveBeenCalledTimes(2)
  })

  it("skips a grade entirely when it already has enough sections", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue({
      maxClasses: null,
    } as any)
    vi.mocked(db.classroom.count).mockResolvedValue(0)
    vi.mocked(db.section.count).mockResolvedValue(3)
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
      gradeNumber: 1,
    } as any)
    vi.mocked(db.section.findMany).mockResolvedValue([
      { letter: "A" },
      { letter: "B" },
      { letter: "C" },
    ] as any)

    const result = await generateSections({
      grades: [
        { gradeId: "g1", sections: 3, capacityPerSection: 30, roomType: "rt1" },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.created).toBe(0)
      expect(result.data.details[0]).toMatch(/already has 3 sections/)
    }
    expect(vi.mocked(db.section.create)).not.toHaveBeenCalled()
  })

  it("aborts the transaction when section capacity exceeds the existing room capacity", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue({
      maxClasses: null,
    } as any)
    vi.mocked(db.classroom.count).mockResolvedValue(0)
    vi.mocked(db.section.count).mockResolvedValue(0)
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
      gradeNumber: 1,
    } as any)
    vi.mocked(db.section.findMany).mockResolvedValue([] as any)
    // Existing room has lower capacity than requested
    vi.mocked(db.classroom.upsert).mockResolvedValue({
      id: "room-existing",
      capacity: 20,
    } as any)

    const result = await generateSections({
      grades: [
        { gradeId: "g1", sections: 1, capacityPerSection: 30, roomType: "rt1" },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe("CAPACITY_EXCEEDS_ROOM")
      // Structured details so the client can build a translated message.
      const details = JSON.parse((result as any).details ?? "{}")
      expect(details).toMatchObject({
        sectionCapacity: 30,
        roomCapacity: 20,
      })
    }
    expect(vi.mocked(db.section.create)).not.toHaveBeenCalled()
  })
})
