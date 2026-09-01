// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  notifyDevelopersOfPendingVideo,
  notifySchoolOfVideoDecision,
} from "@/lib/platform-notification"

vi.mock("@/lib/db", () => ({
  db: {
    user: { findMany: vi.fn() },
    school: { findUnique: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}))

const mockUsers = db.user.findMany as ReturnType<typeof vi.fn>
const mockSchool = db.school.findUnique as ReturnType<typeof vi.fn>
const mockCreateMany = db.notification.createMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockSchool.mockResolvedValue({ name: "نموذج" })
  mockUsers.mockResolvedValue([{ id: "dev-1" }, { id: "dev-2" }])
  mockCreateMany.mockResolvedValue({ count: 2 })
})

describe("notifyDevelopersOfPendingVideo", () => {
  it("stamps the REQUESTING school's id on a DEVELOPER's row", async () => {
    // This is the whole trick: Notification.schoolId is a required FK and a
    // DEVELOPER has none of their own, so the row carries the school that is
    // asking. Without it no platform notification can exist at all.
    await notifyDevelopersOfPendingVideo({
      schoolId: "school-1",
      actorId: "teacher-1",
      videoId: "v-1",
      title: "Algebra intro",
    })

    const rows = mockCreateMany.mock.calls[0][0].data
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row.schoolId).toBe("school-1")
      expect(row.type).toBe("content_review")
    }
    expect(rows.map((r: { userId: string }) => r.userId)).toEqual([
      "dev-1",
      "dev-2",
    ])
  })

  it("targets DEVELOPERs, unscoped by school", async () => {
    await notifyDevelopersOfPendingVideo({
      schoolId: "school-1",
      actorId: "teacher-1",
      videoId: "v-1",
      title: "T",
    })
    expect(mockUsers).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "DEVELOPER" } })
    )
  })

  it("names the school in the body", async () => {
    // An operator watching every tenant cannot act on "a video was submitted".
    await notifyDevelopersOfPendingVideo({
      schoolId: "school-1",
      actorId: "teacher-1",
      videoId: "v-1",
      title: "Algebra intro",
      lessonName: "Fractions",
    })
    const body = mockCreateMany.mock.calls[0][0].data[0].body
    expect(body).toContain("نموذج")
    expect(body).toContain("Fractions")
  })

  it("deep-links to the operator queue", async () => {
    await notifyDevelopersOfPendingVideo({
      schoolId: "school-1",
      actorId: "t",
      videoId: "v-1",
      title: "T",
    })
    expect(mockCreateMany.mock.calls[0][0].data[0].metadata.url).toBe(
      "/catalog/approvals"
    )
  })

  it("sets lang from the text, never the column default", async () => {
    // A row labelled "ar" while holding English text is permanently
    // untranslatable — the translator no-ops when source === display.
    await notifyDevelopersOfPendingVideo({
      schoolId: "school-1",
      actorId: "t",
      videoId: "v-1",
      title: "Algebra intro",
    })
    expect(mockCreateMany.mock.calls[0][0].data[0].lang).toBe("en")
  })

  it("no-ops without a school — a DEVELOPER's own upload has none", async () => {
    await notifyDevelopersOfPendingVideo({
      schoolId: null,
      actorId: "dev-1",
      videoId: "v-1",
      title: "T",
    })
    expect(mockCreateMany).not.toHaveBeenCalled()
  })

  it("no-ops when the platform has no DEVELOPERs", async () => {
    mockUsers.mockResolvedValueOnce([])
    await notifyDevelopersOfPendingVideo({
      schoolId: "school-1",
      actorId: "t",
      videoId: "v-1",
      title: "T",
    })
    expect(mockCreateMany).not.toHaveBeenCalled()
  })

  it("swallows failures — a notification must never fail the upload", async () => {
    mockCreateMany.mockRejectedValueOnce(new Error("db down"))
    await expect(
      notifyDevelopersOfPendingVideo({
        schoolId: "school-1",
        actorId: "t",
        videoId: "v-1",
        title: "T",
      })
    ).resolves.toBeUndefined()
  })
})

describe("notifySchoolOfVideoDecision", () => {
  beforeEach(() => {
    mockUsers.mockResolvedValue([{ id: "admin-1" }])
  })

  it("reaches the uploader AND the school's admins", async () => {
    await notifySchoolOfVideoDecision({
      schoolId: "school-1",
      uploaderId: "teacher-1",
      videoId: "v-1",
      title: "Algebra intro",
      decision: "APPROVED",
    })
    const rows = mockCreateMany.mock.calls[0][0].data
    expect(rows.map((r: { userId: string }) => r.userId).sort()).toEqual([
      "admin-1",
      "teacher-1",
    ])
    expect(rows[0].type).toBe("content_approved")
  })

  it("does not double-notify an admin who is also the uploader", async () => {
    mockUsers.mockResolvedValueOnce([])
    await notifySchoolOfVideoDecision({
      schoolId: "school-1",
      uploaderId: "admin-1",
      videoId: "v-1",
      title: "T",
      decision: "APPROVED",
    })
    expect(mockCreateMany.mock.calls[0][0].data).toHaveLength(1)
  })

  it("carries the rejection reason so the feedback is actionable", async () => {
    await notifySchoolOfVideoDecision({
      schoolId: "school-1",
      uploaderId: "teacher-1",
      videoId: "v-1",
      title: "Algebra intro",
      decision: "REJECTED",
      rejectionReason: "Audio too low",
    })
    const row = mockCreateMany.mock.calls[0][0].data[0]
    expect(row.type).toBe("content_rejected")
    expect(row.priority).toBe("high")
    expect(row.body).toContain("Audio too low")
    expect(row.metadata.rejectionReason).toBe("Audio too low")
  })

  it("no-ops for a platform-scope video with no school", async () => {
    await notifySchoolOfVideoDecision({
      schoolId: null,
      uploaderId: "dev-1",
      videoId: "v-1",
      title: "T",
      decision: "APPROVED",
    })
    expect(mockCreateMany).not.toHaveBeenCalled()
  })
})
