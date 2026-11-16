// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

/**
 * The practice room row: created / re-opened when the school switch goes ON,
 * cancelled when it goes OFF, and refused (nothing written) when the school
 * has no teacher to own it.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  closePracticeRoom,
  ensurePracticeRoom,
  PRACTICE_ROOM_END,
} from "@/components/school-dashboard/live/actions/practice-room"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    school: { findUnique: vi.fn() },
    conference: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))
const closeRoom = vi.fn(async () => undefined)
vi.mock("@/components/school-dashboard/live/livekit/close-room", () => ({
  closeRoom: (...a: unknown[]) => closeRoom(...a),
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  m(db.conference.findFirst).mockResolvedValue(null)
  m(db.teacher.findFirst).mockResolvedValue({ id: "t-1" })
  m(db.school.findUnique).mockResolvedValue({ preferredLanguage: "ar" })
  m(db.conference.create).mockResolvedValue({ id: "pr-1" })
  m(db.conference.update).mockResolvedValue({})
})

describe("ensurePracticeRoom", () => {
  it("creates the room: school-visible, never-ending, no recording, no section or slot, Arabic title", async () => {
    const r = await ensurePracticeRoom("school-1")
    expect(r).toEqual({ success: true })
    expect(db.teacher.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: "school-1", employmentStatus: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      })
    )
    const data = m(db.conference.create).mock.calls[0][0].data
    expect(data).toMatchObject({
      schoolId: "school-1",
      teacherId: "t-1",
      title: "غرفة التجربة",
      lang: "ar",
      visibility: "school",
      isPractice: true,
      status: "scheduled",
      recordingEnabled: false,
      sectionId: null,
      timetableId: null,
      scheduledEnd: PRACTICE_ROOM_END,
    })
    expect(m(db.conference.update).mock.calls[0][0].data.roomName).toBe(
      "sch-school-1-lc-pr-1"
    )
  })

  it("uses the English title for an English school", async () => {
    m(db.school.findUnique).mockResolvedValue({ preferredLanguage: "en" })
    await ensurePracticeRoom("school-1")
    expect(m(db.conference.create).mock.calls[0][0].data.title).toBe(
      "Practice room"
    )
  })

  it("a school with no teacher gets a clear error and nothing is written", async () => {
    m(db.teacher.findFirst).mockResolvedValue(null)
    const r = await ensurePracticeRoom("school-1")
    expect(r).toMatchObject({
      success: false,
      error: "LIVE_CLASS_PRACTICE_NO_TEACHER",
    })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("re-opens a cancelled room instead of making a second one", async () => {
    m(db.conference.findFirst).mockResolvedValue({
      id: "pr-9",
      status: "cancelled",
      scheduledEnd: PRACTICE_ROOM_END,
    })
    const r = await ensurePracticeRoom("school-1")
    expect(r).toEqual({ success: true })
    expect(db.conference.create).not.toHaveBeenCalled()
    expect(db.conference.update).toHaveBeenCalledWith({
      where: { id: "pr-9" },
      data: expect.objectContaining({
        status: "scheduled",
        actualStart: null,
        actualEnd: null,
        roomSid: null,
      }),
    })
  })

  it("an existing row converted by hand (any isPractice row) is used as is, needing no teacher", async () => {
    m(db.teacher.findFirst).mockResolvedValue(null)
    m(db.conference.findFirst).mockResolvedValue({
      id: "pr-9",
      status: "scheduled",
      scheduledEnd: PRACTICE_ROOM_END,
    })
    expect(await ensurePracticeRoom("school-1")).toEqual({ success: true })
    expect(db.conference.create).not.toHaveBeenCalled()
    expect(db.conference.update).not.toHaveBeenCalled()
  })
})

describe("closePracticeRoom", () => {
  it("cancels the row (kept, not deleted) before closing its SFU room", async () => {
    m(db.conference.findMany).mockResolvedValue([
      { id: "pr-1", roomName: "sch-school-1-lc-pr-1" },
    ])
    await closePracticeRoom("school-1")
    expect(db.conference.updateMany).toHaveBeenCalledWith({
      where: { schoolId: "school-1", id: { in: ["pr-1"] } },
      data: { status: "cancelled" },
    })
    expect(closeRoom).toHaveBeenCalledWith("sch-school-1-lc-pr-1")
    expect(
      m(db.conference.updateMany).mock.invocationCallOrder[0]
    ).toBeLessThan(closeRoom.mock.invocationCallOrder[0])
  })

  it("does nothing when there is no open practice row", async () => {
    m(db.conference.findMany).mockResolvedValue([])
    await closePracticeRoom("school-1")
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })
})
