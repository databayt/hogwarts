// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { POST } from "@/app/api/mobile/teacher/classes/[classId]/attendance/route"

const tx = {
  attendance: { updateMany: vi.fn(), createMany: vi.fn() },
}

vi.mock("@/lib/db", () => ({
  db: {
    section: { findFirst: vi.fn(), findMany: vi.fn() },
    teacher: { findFirst: vi.fn() },
    student: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
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

const post = (sectionId: string, body: unknown) =>
  POST(
    new NextRequest(
      `http://localhost/api/mobile/teacher/classes/${sectionId}/attendance`,
      {
        method: "POST",
        headers: { Authorization: "Bearer test" },
        body: JSON.stringify(body),
      }
    ),
    { params: Promise.resolve({ classId: sectionId }) }
  )

const body = {
  date: "2026-10-04",
  records: [
    { student_id: "s1", status: "PRESENT" },
    { student_id: "s2", status: "ABSENT" },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.section.findFirst).mockResolvedValue({ id: "7a" } as never)
  vi.mocked(db.student.findMany).mockResolvedValue([
    { id: "s1" },
    { id: "s2" },
  ] as never)
  vi.mocked(db.attendance.findMany).mockResolvedValue([] as never)
  vi.mocked(db.$transaction).mockImplementation((async (
    cb: (t: typeof tx) => Promise<unknown>
  ) => cb(tx)) as never)
})

describe("POST /api/mobile/teacher/classes/:classId/attendance", () => {
  it("reads the id as a section of the token's school", async () => {
    await authAs("ADMIN")
    vi.mocked(db.section.findFirst).mockResolvedValue(null)

    const res = await post("other-school-section", body)

    expect(res.status).toBe(404)
    expect(db.section.findFirst).toHaveBeenCalledWith({
      where: { id: "other-school-section", schoolId: SCHOOL },
      select: { id: true },
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("lets a teacher mark only their own sections", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.section.findMany).mockResolvedValue([{ id: "8b" }] as never)

    const res = await post("7a", body)

    expect(res.status).toBe(403)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("refuses students who are not in the section", async () => {
    await authAs("ADMIN")
    vi.mocked(db.student.findMany).mockResolvedValue([{ id: "s1" }] as never)

    const res = await post("7a", body)

    expect(res.status).toBe(400)
    expect(vi.mocked(db.student.findMany).mock.calls[0][0]!.where).toEqual({
      schoolId: SCHOOL,
      sectionId: "7a",
      id: { in: ["s1", "s2"] },
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("updates the day's rows it finds and creates the rest, on the section", async () => {
    await authAs("ADMIN")
    vi.mocked(db.attendance.findMany)
      .mockResolvedValueOnce([{ id: "att-1", studentId: "s1" }] as never)
      .mockResolvedValueOnce([
        { id: "att-1", studentId: "s1", status: "PRESENT" },
        { id: "att-2", studentId: "s2", status: "ABSENT" },
      ] as never)

    const res = await post("7a", body)

    expect(res.status).toBe(200)
    expect(
      vi.mocked(db.attendance.findMany).mock.calls[0][0]!.where
    ).toMatchObject({ schoolId: SCHOOL, sectionId: "7a", periodId: null })
    expect(tx.attendance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "att-1", schoolId: SCHOOL },
        data: expect.objectContaining({ status: "PRESENT", deletedAt: null }),
      })
    )
    const created = tx.attendance.createMany.mock.calls[0][0].data
    expect(created).toEqual([
      expect.objectContaining({
        schoolId: SCHOOL,
        studentId: "s2",
        sectionId: "7a",
        status: "ABSENT",
      }),
    ])
    expect(created[0]).not.toHaveProperty("classId")
    expect((await res.json()).count).toBe(2)
  })

  it("rejects an unknown status before writing", async () => {
    await authAs("ADMIN")

    const res = await post("7a", {
      records: [{ student_id: "s1", status: "MAYBE" }],
    })

    expect(res.status).toBe(400)
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
