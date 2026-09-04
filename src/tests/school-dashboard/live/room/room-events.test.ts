// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { requireContext } from "@/components/school-dashboard/live/actions/helpers"
import { recordClassEvent } from "@/components/school-dashboard/live/actions/room-events"

vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  requireContext: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    conferenceEvent: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mCtx = m(requireContext)
const mSession = m(db.conference.findFirst)
const mTeacher = m(db.teacher.findFirst)
const mFind = m(db.conferenceEvent.findUnique)
const mCreate = m(db.conferenceEvent.create)

beforeEach(() => {
  vi.clearAllMocks()
  mCtx.mockResolvedValue({
    ok: true,
    schoolId: "school-1",
    userId: "u-teacher",
    role: "TEACHER",
  })
  mSession.mockResolvedValue({ id: "s1" })
  mTeacher.mockResolvedValue({ id: "t1" })
  mFind.mockResolvedValue(null)
  mCreate.mockResolvedValue({ id: "ev1" })
})

describe("recordClassEvent", () => {
  it("writes a poll result once, keyed on the poll id", async () => {
    const r = await recordClassEvent({
      sessionId: "s1",
      kind: "poll_closed",
      key: "p1",
      payload: { total: 3 },
    })
    expect(r).toEqual({ success: true, data: { id: "ev1", duplicate: false } })
    expect(mCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: "school-1",
          sessionId: "s1",
          eventType: "poll_closed",
          eventId: "lc:s1:poll_closed:p1",
        }),
        select: { id: true },
      })
    )
  })

  it("is a no-op on a repeat", async () => {
    mFind.mockResolvedValueOnce({ id: "ev-old" })
    const r = await recordClassEvent({
      sessionId: "s1",
      kind: "question",
      key: "q1",
      payload: {},
    })
    expect(r).toEqual({
      success: true,
      data: { id: "ev-old", duplicate: true },
    })
    expect(mCreate).not.toHaveBeenCalled()
  })

  it("a co-teaching TEACHER (not the session's assigned owner) may still persist events — CO_HOST parity with join-core", async () => {
    // teacher.findFirst resolves a Teacher row in THIS school whose id differs
    // from the session's assigned teacherId — exactly the co-host case
    // join-core's resolveParticipantRole admits as CO_HOST.
    mTeacher.mockResolvedValueOnce({ id: "someone-else" })
    const r = await recordClassEvent({
      sessionId: "s1",
      kind: "question",
      key: "q1",
      payload: {},
    })
    expect(r).toEqual({ success: true, data: { id: "ev1", duplicate: false } })
    expect(mCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorUserId: "u-teacher" }),
      })
    )
  })

  it("refuses a TEACHER with no Teacher row in this school (tenant-scoped), an unknown kind, and a bad key", async () => {
    mTeacher.mockResolvedValueOnce(null)
    let r = await recordClassEvent({
      sessionId: "s1",
      kind: "question",
      key: "q1",
      payload: {},
    })
    expect(r.success).toBe(false)

    r = await recordClassEvent({
      sessionId: "s1",
      kind: "nope" as never,
      key: "q1",
      payload: {},
    })
    expect(r.success).toBe(false)

    r = await recordClassEvent({
      sessionId: "s1",
      kind: "question",
      key: "../x",
      payload: {},
    })
    expect(r.success).toBe(false)
    expect(mCreate).not.toHaveBeenCalled()
  })

  it("ADMIN as CO_HOST persists events with no Teacher lookup at all", async () => {
    mCtx.mockResolvedValueOnce({
      ok: true,
      schoolId: "school-1",
      userId: "u-admin",
      role: "ADMIN",
    })
    const r = await recordClassEvent({
      sessionId: "s1",
      kind: "poll_closed",
      key: "p2",
      payload: {},
    })
    expect(r.success).toBe(true)
    expect(mTeacher).not.toHaveBeenCalled()
  })
})
