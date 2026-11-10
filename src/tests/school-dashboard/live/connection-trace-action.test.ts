// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { recordConnectionTrace } from "@/components/school-dashboard/live/actions/connection-trace"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    conferenceParticipant: { findFirst: vi.fn() },
    conferenceEvent: { count: vi.fn(), create: vi.fn() },
  },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mAuth = m(auth)
const mTenant = m(getTenantContext)
const mSeat = m(db.conferenceParticipant.findFirst)
const mCount = m(db.conferenceEvent.count)
const mCreate = m(db.conferenceEvent.create)

const events = () => [
  { t: Date.now() - 5_000, k: "hidden" },
  { t: Date.now(), k: "visible", ms: 5_000 },
]

beforeEach(() => {
  vi.clearAllMocks()
  mAuth.mockResolvedValue({ user: { id: "u-student" } })
  mTenant.mockResolvedValue({ schoolId: "school-1" })
  mSeat.mockResolvedValue({ id: "seat-1" })
  mCount.mockResolvedValue(0)
  mCreate.mockResolvedValue({ id: "ev-1" })
})

describe("recordConnectionTrace", () => {
  it("writes one row for a seated caller, scoped to their school", async () => {
    const r = await recordConnectionTrace({ sessionId: "s1", events: events() })
    expect(r).toEqual({ success: true, data: { stored: true } })
    expect(mSeat).toHaveBeenCalledWith({
      where: { sessionId: "s1", schoolId: "school-1", userId: "u-student" },
      select: { id: true },
    })
    const { data } = mCreate.mock.calls[0][0]
    expect(data).toMatchObject({
      schoolId: "school-1",
      sessionId: "s1",
      eventType: "client_trace",
      actorUserId: "u-student",
    })
    expect(data.payload.v).toBe(1)
    expect(data.payload.events.map((e: { k: string }) => e.k)).toEqual([
      "hidden",
      "visible",
    ])
  })

  it("refuses someone with no seat in the class", async () => {
    mSeat.mockResolvedValueOnce(null)
    const r = await recordConnectionTrace({ sessionId: "s1", events: events() })
    expect(r).toMatchObject({ success: false })
    expect(mCreate).not.toHaveBeenCalled()
  })

  it("refuses a signed-out caller and a caller with no school", async () => {
    mAuth.mockResolvedValueOnce(null)
    expect(
      await recordConnectionTrace({ sessionId: "s1", events: events() })
    ).toMatchObject({ success: false })
    mTenant.mockResolvedValueOnce({ schoolId: null })
    expect(
      await recordConnectionTrace({ sessionId: "s1", events: events() })
    ).toMatchObject({ success: false })
    expect(mCreate).not.toHaveBeenCalled()
  })

  it("rejects a bad session id or a trace with nothing usable in it", async () => {
    expect(
      await recordConnectionTrace({ sessionId: "s1'; --", events: events() })
    ).toMatchObject({ success: false })
    expect(
      await recordConnectionTrace({
        sessionId: "s1",
        events: [{ t: Date.now(), k: "made_up" }],
      })
    ).toMatchObject({ success: false })
    expect(
      await recordConnectionTrace({ sessionId: "s1", events: "hidden" })
    ).toMatchObject({ success: false })
    expect(mAuth).not.toHaveBeenCalled()
  })

  it("stops writing past the per-seat cap, and says the batch is taken", async () => {
    mCount.mockResolvedValueOnce(40)
    const r = await recordConnectionTrace({ sessionId: "s1", events: events() })
    expect(r).toEqual({ success: true, data: { stored: false } })
    expect(mCreate).not.toHaveBeenCalled()
  })
})
