// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { syncLiveAttendance } from "@/components/school-dashboard/live/actions/attendance-sync"
import { GET } from "@/app/api/cron/end-stale-live-classes/route"

vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findMany: vi.fn(), updateMany: vi.fn() },
    conferenceRecording: {
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
  },
}))
const closeRoom = vi.fn(async () => undefined)
vi.mock("@/components/school-dashboard/live/livekit/close-room", () => ({
  closeRoom: (...a: unknown[]) => closeRoom(...a),
}))
vi.mock("@/components/school-dashboard/live/actions/attendance-sync", () => ({
  syncLiveAttendance: vi.fn(async () => ({ marked: 0, updated: 0 })),
}))

const NOW = new Date("2026-06-20T12:00:00Z").getTime()
const req = () =>
  new Request("http://localhost/api/cron/end-stale-live-classes")

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  vi.mocked(isAuthorizedCron).mockReturnValue(true)
  vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 1 } as never)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("end-stale-live-classes cron — auth", () => {
  it("returns 401 when not an authorized cron request", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(false)
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(db.conference.findMany).not.toHaveBeenCalled()
  })
})

describe("end-stale-live-classes cron — detection", () => {
  it("closes a timetable class 10 min after its bell, any other live session after 30", async () => {
    await GET(req())
    const call = vi.mocked(db.conference.findMany).mock.calls[0][0] as {
      where: {
        status: string
        deletedAt: null
        OR: Array<{ scheduledEnd: { lt: Date }; timetableId?: unknown }>
      }
    }
    expect(call.where.status).toBe("live")
    expect(call.where.deletedAt).toBeNull()
    expect(call.where.OR[0].scheduledEnd.lt.getTime()).toBe(
      NOW - 30 * 60 * 1000
    )
    expect(call.where.OR[1].timetableId).toEqual({ not: null })
    expect(call.where.OR[1].scheduledEnd.lt.getTime()).toBe(
      NOW - 10 * 60 * 1000
    )
  })
})

describe("end-stale-live-classes cron — close + sync", () => {
  it("status-guards the close and runs attendance sync per ended session", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      { id: "lcs-1", schoolId: "school-1" },
      { id: "lcs-2", schoolId: "school-2" },
    ] as never)

    const res = await GET(req())
    const body = (await res.json()) as {
      ok: boolean
      scanned: number
      ended: number
    }

    expect(body).toMatchObject({ ok: true, scanned: 2, ended: 2 })
    // Each close is guarded on status: "live" so a racing webhook wins cleanly.
    expect(db.conference.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lcs-1", schoolId: "school-1", status: "live" },
        data: expect.objectContaining({ status: "ended" }),
      })
    )
    expect(syncLiveAttendance).toHaveBeenCalledTimes(2)
    expect(syncLiveAttendance).toHaveBeenCalledWith("school-1", "lcs-1")
    expect(syncLiveAttendance).toHaveBeenCalledWith("school-2", "lcs-2")
  })

  // The clock ended the class in the database only: the room (and its
  // recording) ran on while one tab stayed open, and the people in it read
  // "token expired" instead of "the class has ended".
  it("closes the SFU room of each class it ends, stopping a recording still running", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        schoolId: "school-1",
        roomName: "sch-school-1-lc-lcs-1",
        recordings: [{ egressId: "egr-1" }],
      },
      {
        id: "lcs-2",
        schoolId: "school-2",
        roomName: "sch-school-2-lc-lcs-2",
        recordings: [],
      },
    ] as never)

    await GET(req())

    expect(closeRoom).toHaveBeenCalledWith("sch-school-1-lc-lcs-1", ["egr-1"])
    expect(closeRoom).toHaveBeenCalledWith("sch-school-2-lc-lcs-2", [])
  })

  it("leaves the room alone when another writer already ended the class", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      { id: "lcs-1", schoolId: "school-1", roomName: "r", recordings: [] },
    ] as never)
    vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 0 } as never)

    await GET(req())

    expect(closeRoom).not.toHaveBeenCalled()
  })

  it("does not sync a session another worker already closed (count 0)", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      { id: "lcs-1", schoolId: "school-1" },
    ] as never)
    vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 0 } as never)

    const res = await GET(req())
    const body = (await res.json()) as { ended: number }

    expect(body.ended).toBe(0)
    expect(syncLiveAttendance).not.toHaveBeenCalled()
  })
})
