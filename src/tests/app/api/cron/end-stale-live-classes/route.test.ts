// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { syncConferenceAttendance } from "@/components/school-dashboard/conference/actions/attendance-sync"
import { GET } from "@/app/api/cron/end-stale-live-classes/route"

vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findMany: vi.fn(), updateMany: vi.fn() },
  },
}))
vi.mock(
  "@/components/school-dashboard/conference/actions/attendance-sync",
  () => ({
    syncConferenceAttendance: vi.fn(async () => ({ marked: 0, updated: 0 })),
  })
)

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
  it("targets only live sessions whose scheduledEnd is >30 min past", async () => {
    await GET(req())
    const call = vi.mocked(db.conference.findMany).mock.calls[0][0] as {
      where: { status: string; scheduledEnd: { lt: Date }; deletedAt: null }
    }
    expect(call.where.status).toBe("live")
    expect(call.where.deletedAt).toBeNull()
    expect(call.where.scheduledEnd.lt.getTime()).toBe(NOW - 30 * 60 * 1000)
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

    expect(body).toEqual({ ok: true, scanned: 2, ended: 2 })
    // Each close is guarded on status: "live" so a racing webhook wins cleanly.
    expect(db.conference.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lcs-1", schoolId: "school-1", status: "live" },
        data: expect.objectContaining({ status: "ended" }),
      })
    )
    expect(syncConferenceAttendance).toHaveBeenCalledTimes(2)
    expect(syncConferenceAttendance).toHaveBeenCalledWith("school-1", "lcs-1")
    expect(syncConferenceAttendance).toHaveBeenCalledWith("school-2", "lcs-2")
  })

  it("does not sync a session another worker already closed (count 0)", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      { id: "lcs-1", schoolId: "school-1" },
    ] as never)
    vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 0 } as never)

    const res = await GET(req())
    const body = (await res.json()) as { ended: number }

    expect(body.ended).toBe(0)
    expect(syncConferenceAttendance).not.toHaveBeenCalled()
  })
})
