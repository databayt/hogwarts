// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { getTenantContext } from "@/lib/tenant-context"

import {
  sendBatchGradeNotifications,
  sendGradeNotification,
} from "../notifications"

vi.mock("@/lib/db", () => ({
  db: {
    result: { findFirst: vi.fn() },
    student: { findUnique: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
    reportCard: { findMany: vi.fn() },
    notificationBatch: { create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn(),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

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

describe("sendGradeNotification", () => {
  it("404s for a cross-tenant result", async () => {
    vi.mocked(db.result.findFirst).mockResolvedValue(null)
    const r = await sendGradeNotification({
      resultId: "res-x",
      type: "grade_posted",
    })
    expect(r.success).toBe(false)
    const where = vi.mocked(db.result.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      id: "res-x",
      schoolId: SCHOOL,
    })
  })

  it("dispatches to the student AND each linked guardian", async () => {
    vi.mocked(db.result.findFirst).mockResolvedValue({
      studentId: "stu-1",
      grade: "A",
      score: 90,
      maxScore: 100,
      student: {
        id: "stu-1",
        userId: "user-stu",
        firstName: "John",
        lastName: "Smith",
      },
      class: { subject: { name: "Math" } },
    } as never)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      { guardian: { userId: "user-g1" } },
      { guardian: { userId: "user-g2" } },
    ] as never)
    vi.mocked(dispatchNotification).mockResolvedValue("notif-id" as never)

    const r = await sendGradeNotification({
      resultId: "res-1",
      type: "grade_posted",
    })

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.count).toBe(3)
    expect(dispatchNotification).toHaveBeenCalledTimes(3)
    // every dispatch is schoolId-scoped
    for (const call of vi.mocked(dispatchNotification).mock.calls) {
      expect((call[0] as { schoolId: string }).schoolId).toBe(SCHOOL)
    }
  })

  it("guardian lookup is schoolId-scoped via the student relation", async () => {
    vi.mocked(db.result.findFirst).mockResolvedValue({
      studentId: "stu-1",
      grade: "A",
      score: 90,
      maxScore: 100,
      student: { id: "stu-1", userId: null, firstName: "J", lastName: "S" },
      class: { subject: { name: "Math" } },
    } as never)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([] as never)
    vi.mocked(dispatchNotification).mockResolvedValue("id" as never)

    await sendGradeNotification({ resultId: "res-1", type: "grade_posted" })

    const arg = vi.mocked(db.studentGuardian.findMany).mock.calls[0][0]
    expect((arg as { where: Record<string, unknown> }).where).toMatchObject({
      studentId: "stu-1",
      student: { schoolId: SCHOOL },
    })
  })
})

describe("sendBatchGradeNotifications", () => {
  it("returns count 0 (no batch row) when nothing is published", async () => {
    vi.mocked(db.reportCard.findMany).mockResolvedValue([] as never)
    const r = await sendBatchGradeNotifications({
      termId: "term-1",
      type: "report_ready",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.count).toBe(0)
    expect(db.notificationBatch.create).not.toHaveBeenCalled()
  })

  it("creates a batch, dispatches per recipient, and finalizes the count", async () => {
    vi.mocked(db.reportCard.findMany).mockResolvedValue([
      {
        studentId: "stu-1",
        student: {
          id: "stu-1",
          userId: "user-stu",
          firstName: "John",
          lastName: "Smith",
        },
      },
    ] as never)
    vi.mocked(db.notificationBatch.create).mockResolvedValue({
      id: "batch-1",
    } as never)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      { guardian: { userId: "user-g1" } },
    ] as never)
    vi.mocked(dispatchNotification).mockResolvedValue("id" as never)
    vi.mocked(db.notificationBatch.update).mockResolvedValue({} as never)

    const r = await sendBatchGradeNotifications({
      termId: "term-1",
      type: "report_ready",
    })

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.count).toBe(2) // student + 1 guardian
    expect(db.notificationBatch.update).toHaveBeenCalledWith({
      where: { id: "batch-1" },
      data: { totalCount: 2, status: "completed" },
    })
  })
})
