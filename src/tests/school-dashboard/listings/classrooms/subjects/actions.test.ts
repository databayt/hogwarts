// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { bulkUpdateSubjectRooms, getSubjectRoomAssignments } from "@/components/school-dashboard/listings/classrooms/subjects/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/content-display", () => ({
  // identity translation keeps assertions readable
  getDisplayText: vi.fn(async (text: string) => text),
}))
vi.mock("@/lib/db", () => ({
  db: {
    academicGrade: { findMany: vi.fn() },
    class: { findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
    classroom: { findMany: vi.fn() },
    $transaction: vi.fn(),
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
// getSubjectRoomAssignments
// ============================================================================

describe("getSubjectRoomAssignments", () => {
  it("returns NOT_AUTHENTICATED without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await getSubjectRoomAssignments("en")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns MISSING_SCHOOL without tenant context", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "demo",
      role: "ADMIN",
      locale: "en",
    })
    const result = await getSubjectRoomAssignments("en")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
  })

  it("returns UNAUTHORIZED for roles without read permission", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "STUDENT", schoolId: SCHOOL },
    } as any)
    const result = await getSubjectRoomAssignments("en")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
  })

  it("returns an empty array when the school has no grades", async () => {
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([] as any)
    const result = await getSubjectRoomAssignments("en")
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual([])
    expect(vi.mocked(db.class.findMany)).not.toHaveBeenCalled()
  })

  it("aggregates classes, weekly periods, and shared rooms per grade", async () => {
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", lang: "en", gradeNumber: 1 },
    ] as any)
    vi.mocked(db.class.findMany).mockResolvedValue([
      {
        id: "c1",
        classroomId: "r1",
        subject: { id: "sub1", name: "Math", lang: "en" },
        classroom: {
          id: "r1",
          roomName: "A101",
          lang: "en",
          classroomType: { name: "Classroom", lang: "en" },
        },
        teacher: { firstName: "Ada", lastName: "Lovelace" },
      },
    ] as any)
    vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
      { catalogSubjectId: "sub1", weeklyPeriods: 4 },
    ] as any)
    vi.mocked(db.classroom.findMany).mockResolvedValue([
      {
        id: "r1",
        roomName: "A101",
        lang: "en",
        gradeId: "g1",
        capacity: 30,
        classroomType: { name: "Classroom", lang: "en" },
        _count: { classes: 2 },
      },
      {
        id: "r2",
        roomName: "Library",
        lang: "en",
        gradeId: null,
        capacity: 60,
        classroomType: { name: "Shared", lang: "en" },
        _count: { classes: 1 },
      },
    ] as any)

    const result = await getSubjectRoomAssignments("en")

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      const g = result.data[0]
      expect(g.gradeName).toBe("Grade 1")
      expect(g.classes).toHaveLength(1)
      expect(g.classes[0]).toMatchObject({
        classId: "c1",
        teacherName: "Ada Lovelace",
        currentRoomId: "r1",
        weeklyPeriods: 4,
      })
      expect(g.availableRooms).toHaveLength(2)
      expect(g.availableRooms.find((r) => r.id === "r2")?.isShared).toBe(true)
      expect(g.availableRooms.find((r) => r.id === "r1")?.isShared).toBe(false)
    }
  })

  it("scopes the grade query by schoolId", async () => {
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([] as any)
    await getSubjectRoomAssignments("en")
    expect(
      vi.mocked(db.academicGrade.findMany).mock.calls[0][0]?.where
    ).toEqual({
      schoolId: SCHOOL,
    })
  })

  it("returns UNKNOWN when an underlying query throws", async () => {
    vi.mocked(db.academicGrade.findMany).mockRejectedValue(new Error("db down"))
    const result = await getSubjectRoomAssignments("en")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNKNOWN")
  })
})

// ============================================================================
// bulkUpdateSubjectRooms
// ============================================================================

describe("bulkUpdateSubjectRooms", () => {
  it("returns NOT_AUTHENTICATED without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await bulkUpdateSubjectRooms({
      assignments: [{ classId: "c1", classroomId: "r1" }],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns MISSING_SCHOOL without tenant context", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "demo",
      role: "ADMIN",
      locale: "en",
    })
    const result = await bulkUpdateSubjectRooms({
      assignments: [{ classId: "c1", classroomId: "r1" }],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
  })

  it("returns UNAUTHORIZED for read-only roles", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "TEACHER", schoolId: SCHOOL },
    } as any)
    const result = await bulkUpdateSubjectRooms({
      assignments: [{ classId: "c1", classroomId: "r1" }],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
  })

  it("returns VALIDATION_ERROR when payload fails the Zod schema", async () => {
    const result = await bulkUpdateSubjectRooms({ assignments: [] })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })

  it("returns UNAUTHORIZED when a class belongs to another school", async () => {
    vi.mocked(db.class.count).mockResolvedValue(0) // 0 < 1 expected
    const result = await bulkUpdateSubjectRooms({
      assignments: [{ classId: "c-other", classroomId: "r1" }],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(vi.mocked(db.$transaction)).not.toHaveBeenCalled()
  })

  it("returns UNAUTHORIZED when a classroom belongs to another school", async () => {
    vi.mocked(db.class.count).mockResolvedValue(1)
    vi.mocked(db.classroom.findMany).mockResolvedValue([] as any)
    const result = await bulkUpdateSubjectRooms({
      assignments: [{ classId: "c1", classroomId: "r-other" }],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(vi.mocked(db.$transaction)).not.toHaveBeenCalled()
  })

  it("rejects assigning a grade-locked room to a different grade's class", async () => {
    vi.mocked(db.class.count).mockResolvedValue(1)
    vi.mocked(db.classroom.findMany).mockResolvedValue([
      { id: "r1", gradeId: "gA" },
    ] as any)
    vi.mocked(db.class.findMany).mockResolvedValue([
      { id: "c1", gradeId: "gB" },
    ] as any)

    const result = await bulkUpdateSubjectRooms({
      assignments: [{ classId: "c1", classroomId: "r1" }],
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
    expect(vi.mocked(db.$transaction)).not.toHaveBeenCalled()
  })

  it("accepts shared rooms (gradeId == null) for any class", async () => {
    vi.mocked(db.class.count).mockResolvedValue(1)
    vi.mocked(db.classroom.findMany).mockResolvedValue([
      { id: "r-shared", gradeId: null },
    ] as any)
    vi.mocked(db.class.findMany).mockResolvedValue([
      { id: "c1", gradeId: "gA" },
    ] as any)
    vi.mocked(db.$transaction).mockResolvedValue([{ count: 1 }] as any)

    const result = await bulkUpdateSubjectRooms({
      assignments: [{ classId: "c1", classroomId: "r-shared" }],
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ updated: 1 })
    expect(vi.mocked(db.$transaction)).toHaveBeenCalledTimes(1)
  })

  it("accepts a same-grade room and reports the update count", async () => {
    vi.mocked(db.class.count).mockResolvedValue(2)
    vi.mocked(db.classroom.findMany).mockResolvedValue([
      { id: "r1", gradeId: "gA" },
      { id: "r2", gradeId: "gA" },
    ] as any)
    vi.mocked(db.class.findMany).mockResolvedValue([
      { id: "c1", gradeId: "gA" },
      { id: "c2", gradeId: "gA" },
    ] as any)
    vi.mocked(db.$transaction).mockResolvedValue([
      { count: 1 },
      { count: 1 },
    ] as any)

    const result = await bulkUpdateSubjectRooms({
      assignments: [
        { classId: "c1", classroomId: "r1" },
        { classId: "c2", classroomId: "r2" },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.updated).toBe(2)
  })
})
