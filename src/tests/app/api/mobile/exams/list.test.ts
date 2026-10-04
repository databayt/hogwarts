// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getStudentScopes } from "@/lib/teaching-scope"
import { GET } from "@/app/api/mobile/exams/route"

vi.mock("@/lib/db", () => ({
  db: {
    schoolExam: { findMany: vi.fn(), count: vi.fn() },
    student: { findFirst: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/teaching-scope", () => ({ getStudentScopes: vi.fn() }))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: "user-1",
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const list = () =>
  GET(
    new NextRequest("http://localhost/api/mobile/exams", {
      headers: { Authorization: "Bearer test" },
    })
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.schoolExam.findMany).mockResolvedValue([
    {
      id: "ex-1",
      title: "Physics",
      description: null,
      examDate: new Date("2026-10-20"),
      startTime: "09:00",
      endTime: "10:00",
      duration: 60,
      totalMarks: 100,
      passingMarks: 50,
      examType: "TEST",
      status: "PLANNED",
      instructions: null,
      classId: null,
      gradeId: "g12",
      sectionId: "12b",
      subject: { id: "phys", name: "Physics" },
      class: null,
      section: { name: "12-B" },
      grade: { name: "Grade 12" },
    },
  ] as never)
  vi.mocked(db.schoolExam.count).mockResolvedValue(1)
})

describe("GET /api/mobile/exams", () => {
  it("shows a student only the exams set for their section, grade or class", async () => {
    await authAs("STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    vi.mocked(getStudentScopes).mockResolvedValue([
      { studentId: "stu-1", sectionId: "12b", gradeId: "g12", classIds: [] },
    ])

    const res = await list()
    const body = await res.json()

    const where = vi.mocked(db.schoolExam.findMany).mock.calls[0][0]!.where!
    expect(where).toMatchObject({ schoolId: SCHOOL, wizardStep: null })
    expect(where.OR).toEqual([
      { sectionId: { in: ["12b"] } },
      { sectionId: null, gradeId: { in: ["g12"] } },
    ])
    expect(body.data[0]).toMatchObject({
      section_id: "12b",
      grade_id: "g12",
      class_id: null,
      class_name: "12-B",
    })
  })

  it("shows a student with no placement nothing", async () => {
    await authAs("STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue(null)
    vi.mocked(getStudentScopes).mockResolvedValue([])

    await list()

    const where = vi.mocked(db.schoolExam.findMany).mock.calls[0][0]!.where!
    expect(where.id).toEqual({ in: [] })
  })

  it("leaves staff on the school's full list", async () => {
    await authAs("TEACHER")

    await list()

    const where = vi.mocked(db.schoolExam.findMany).mock.calls[0][0]!.where!
    expect(where.OR).toBeUndefined()
    expect(getStudentScopes).not.toHaveBeenCalled()
  })
})
