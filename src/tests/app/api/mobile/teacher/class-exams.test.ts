// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTeacherPairs, getTeacherSectionIds } from "@/lib/teaching-scope"
import { GET } from "@/app/api/mobile/teacher/classes/[classId]/assessments/route"
import { POST } from "@/app/api/mobile/teacher/classes/[classId]/grades/route"

vi.mock("@/lib/db", () => ({
  db: {
    section: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    schoolExam: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    student: { findMany: vi.fn() },
    examResult: { upsert: vi.fn() },
  },
}))
vi.mock("@/lib/teaching-scope", () => ({
  getTeacherSectionIds: vi.fn(),
  getTeacherPairs: vi.fn(),
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: "user-1",
    email: "t@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const params = (classId: string) => ({
  params: Promise.resolve({ classId }),
})
const list = (classId: string) =>
  GET(
    new NextRequest(
      `http://localhost/api/mobile/teacher/classes/${classId}/assessments`,
      { headers: { Authorization: "Bearer t" } }
    ),
    params(classId)
  )
const submit = (classId: string, body: unknown) =>
  POST(
    new NextRequest(
      `http://localhost/api/mobile/teacher/classes/${classId}/grades`,
      {
        method: "POST",
        headers: { Authorization: "Bearer t" },
        body: JSON.stringify(body),
      }
    ),
    params(classId)
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.section.findFirst).mockResolvedValue({
    id: "7a",
    gradeId: "g7",
  } as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
  vi.mocked(getTeacherSectionIds).mockResolvedValue(["7a"])
  vi.mocked(getTeacherPairs).mockResolvedValue([
    { sectionId: "7a", subjectId: "math", gradeId: "g7", termId: "term-1" },
  ])
  vi.mocked(db.schoolExam.findMany).mockResolvedValue([])
  vi.mocked(db.schoolExam.count).mockResolvedValue(0)
})

describe("mobile teacher class routes — {classId} is a section", () => {
  it("lists the section's and its grade's exams that the teacher teaches", async () => {
    await authAs("TEACHER")

    const res = await list("7a")

    expect(res.status).toBe(200)
    const where = vi.mocked(db.schoolExam.findMany).mock.calls[0][0]!.where as {
      schoolId: string
      AND: Array<{ OR: unknown[] }>
    }
    expect(where.schoolId).toBe(SCHOOL)
    expect(where.AND[0].OR).toEqual([
      { sectionId: "7a" },
      { sectionId: null, gradeId: "g7" },
    ])
    expect(where.AND[1].OR).toEqual(
      expect.arrayContaining([
        { createdById: "user-1" },
        { subjectId: "math", sectionId: { in: ["7a"] } },
      ])
    )
  })

  it("refuses a teacher who does not work in the section", async () => {
    await authAs("TEACHER")
    vi.mocked(getTeacherSectionIds).mockResolvedValue(["8b"])

    const res = await list("7a")

    expect(res.status).toBe(403)
    expect(db.schoolExam.findMany).not.toHaveBeenCalled()
  })

  it("404s an id that is not this school's section", async () => {
    await authAs("ADMIN")
    vi.mocked(db.section.findFirst).mockResolvedValue(null)

    const res = await list("foreign")

    expect(res.status).toBe(404)
  })

  it("refuses marks for a student outside the section", async () => {
    await authAs("TEACHER")
    vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
      id: "e1",
      totalMarks: 50,
      gradeId: "g7",
      sectionId: null,
    } as never)
    vi.mocked(db.student.findMany).mockResolvedValue([{ id: "s1" }] as never)

    const res = await submit("7a", {
      exam_id: "e1",
      results: [
        { student_id: "s1", score: 40 },
        { student_id: "other-school-student", score: 50 },
      ],
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({
      student_ids: ["other-school-student"],
    })
    expect(
      vi.mocked(db.student.findMany).mock.calls[0][0]!.where
    ).toMatchObject({ schoolId: SCHOOL, sectionId: "7a" })
    expect(db.examResult.upsert).not.toHaveBeenCalled()
  })

  it("records marks for the section's students", async () => {
    await authAs("TEACHER")
    vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
      id: "e1",
      totalMarks: 50,
      gradeId: "g7",
      sectionId: "7a",
    } as never)
    vi.mocked(db.student.findMany).mockResolvedValue([{ id: "s1" }] as never)

    const res = await submit("7a", {
      exam_id: "e1",
      results: [{ student_id: "s1", score: 45 }],
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ count: 1 })
    expect(db.examResult.upsert).toHaveBeenCalledTimes(1)
  })
})
