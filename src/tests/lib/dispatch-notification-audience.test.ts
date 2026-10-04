// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import { audienceUserIds } from "@/lib/teaching-scope"

vi.mock("@/lib/db", () => ({
  db: {
    user: { findMany: vi.fn() },
    notificationPreference: { findMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}))
vi.mock("@/lib/teaching-scope", () => ({ audienceUserIds: vi.fn() }))
vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn(async () => undefined),
}))

const SCHOOL = "school-1"

const send = (extra: Record<string, unknown>) =>
  dispatchNotificationsToAudience({
    schoolId: SCHOOL,
    type: "announcement",
    title: "Trip on Thursday",
    body: "Trip on Thursday",
    ...extra,
  } as Parameters<typeof dispatchNotificationsToAudience>[0])

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.notificationPreference.findMany).mockResolvedValue([])
  vi.mocked(db.notification.createMany).mockResolvedValue({ count: 3 })
  vi.mocked(audienceUserIds).mockResolvedValue([
    "u-student",
    "u-parent",
    "u-teacher",
  ])
})

describe("dispatchNotificationsToAudience — grade and section", () => {
  it("reaches a section's students, their guardians and its teachers", async () => {
    const result = await send({
      targetScope: "section",
      targetSectionId: "7a",
      targetGradeId: "g7",
    })

    expect(audienceUserIds).toHaveBeenCalledWith(
      SCHOOL,
      { gradeId: "g7", sectionId: "7a" },
      { students: true, guardians: true, teachers: true }
    )
    expect(result.created).toBe(3)
    const rows = vi.mocked(db.notification.createMany).mock.calls[0][0]!
      .data as Array<{
      userId: string
      schoolId: string
    }>
    expect(rows.map((r) => r.userId)).toEqual([
      "u-student",
      "u-parent",
      "u-teacher",
    ])
    expect(rows.every((r) => r.schoolId === SCHOOL)).toBe(true)
  })

  it("reaches a whole grade", async () => {
    await send({ targetScope: "grade", targetGradeId: "g7" })

    expect(audienceUserIds).toHaveBeenCalledWith(
      SCHOOL,
      { gradeId: "g7", sectionId: null },
      { students: true, guardians: true, teachers: true }
    )
  })

  it("reaches nobody for a section scope without a section", async () => {
    const result = await send({ targetScope: "section" })

    expect(audienceUserIds).not.toHaveBeenCalled()
    expect(result.created).toBe(0)
  })
})
