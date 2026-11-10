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
    conferenceParticipant: { findFirst: vi.fn() },
    conferenceEvent: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mCtx = m(requireContext)
const mSession = m(db.conference.findFirst)
const mSeat = m(db.conferenceParticipant.findFirst)
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
  // The caller is the class's own teacher unless a test says otherwise.
  mSession.mockResolvedValue({ id: "s1", teacher: { userId: "u-teacher" } })
  mSeat.mockResolvedValue(null)
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

  it("a co-teacher seated in the class (not its assigned owner) still persists events", async () => {
    mSession.mockResolvedValueOnce({ id: "s1", teacher: { userId: "u-owner" } })
    mSeat.mockResolvedValueOnce({ id: "seat" })
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

  it("refuses a teacher with no seat in this class, an unknown kind, and a bad key", async () => {
    mSession.mockResolvedValueOnce({ id: "s1", teacher: { userId: "u-owner" } })
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

  it("ADMIN persists events with no seat lookup at all", async () => {
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
    expect(mSeat).not.toHaveBeenCalled()
  })
})
