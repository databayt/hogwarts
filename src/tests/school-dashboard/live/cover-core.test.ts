// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  coverSession,
  loadCover,
} from "@/components/school-dashboard/live/cover-core"

const hoisted = vi.hoisted(() => ({
  db: {
    conference: { findFirst: vi.fn(), updateMany: vi.fn() },
    conferenceParticipant: { count: vi.fn() },
    liveClassSupervisor: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/db", () => ({ db: hoisted.db }))

const SCHOOL = "school-a"
const future = new Date(Date.now() + 30 * 60_000)
const session = (over: Record<string, unknown> = {}) => ({
  id: "s1",
  title: "Math",
  status: "scheduled",
  provider: "livekit",
  meetingUrl: null,
  scheduledStart: new Date(Date.now() - 10 * 60_000),
  scheduledEnd: future,
  coveredByUserId: null,
  subject: { name: "الرياضيات" },
  section: {
    name: "3 أ",
    grade: { name: "الصف الثالث الابتدائي", gradeNumber: 3, level: null, yearLevel: null },
  },
  school: { timezone: "Africa/Khartoum" },
  ...over,
})
const admin = { userId: "admin", role: "ADMIN" as const, schoolId: SCHOOL }
const staff = { userId: "staff", role: "STAFF" as const, schoolId: SCHOOL }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.conference.findFirst).mockResolvedValue(session() as never)
  vi.mocked(db.conferenceParticipant.count).mockResolvedValue(4 as never)
  vi.mocked(db.liveClassSupervisor.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 1 } as never)
})

describe("loadCover — who may see the page", () => {
  it("shows an admin the class and how many students wait", async () => {
    const r = await loadCover(admin, "s1")
    expect(r).toMatchObject({ ok: true, view: { waiting: 4, state: "ok", stage: "primary" } })
  })
  it("scopes the read to the caller's school", async () => {
    await loadCover(admin, "s1")
    expect(vi.mocked(db.conference.findFirst).mock.calls[0][0]!.where).toMatchObject({
      id: "s1",
      schoolId: SCHOOL,
    })
  })
  it("lets a supervisor of the class's stage in, and refuses one of another stage", async () => {
    vi.mocked(db.liveClassSupervisor.findMany).mockResolvedValue([{ stage: "primary" }] as never)
    expect((await loadCover(staff, "s1")).ok).toBe(true)
    vi.mocked(db.liveClassSupervisor.findMany).mockResolvedValue([{ stage: "secondary" }] as never)
    expect(await loadCover(staff, "s1")).toEqual({ ok: false, reason: "forbidden" })
  })
  it("refuses a class of another school (not found looks like forbidden)", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue(null as never)
    expect(await loadCover(admin, "x")).toEqual({ ok: false, reason: "forbidden" })
  })
})

describe("coverSession", () => {
  it("claims an uncovered class with a guarded write", async () => {
    const r = await coverSession(admin, "s1")
    expect(r).toMatchObject({ success: true, data: { sessionId: "s1", external: null } })
    const arg = vi.mocked(db.conference.updateMany).mock.calls[0][0]!
    expect(arg.where).toMatchObject({ id: "s1", schoolId: SCHOOL, coveredByUserId: null })
    expect(arg.data).toMatchObject({ coveredByUserId: "admin" })
  })
  it("never overwrites another cover", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue(
      session({ coveredByUserId: "someone-else" }) as never
    )
    const r = await coverSession(admin, "s1")
    expect(r).toMatchObject({ error: "LIVE_CLASS_INVALID_STATE" })
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })
  it("a second tap by the same person just walks back in, without writing", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue(
      session({ coveredByUserId: "admin" }) as never
    )
    expect(await coverSession(admin, "s1")).toMatchObject({ success: true })
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })
  it("loses a race cleanly: another supervisor wrote first", async () => {
    vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 0 } as never)
    vi.mocked(db.conference.findFirst)
      .mockResolvedValueOnce(session() as never)
      .mockResolvedValueOnce({ coveredByUserId: "rival" } as never)
    expect(await coverSession(admin, "s1")).toMatchObject({ error: "LIVE_CLASS_INVALID_STATE" })
  })
  it("refuses an unauthorised caller and a class that is over", async () => {
    vi.mocked(db.liveClassSupervisor.findMany).mockResolvedValue([] as never)
    expect(await coverSession(staff, "s1")).toMatchObject({ error: "UNAUTHORIZED" })
    vi.mocked(db.conference.findFirst).mockResolvedValue(session({ status: "cancelled" }) as never)
    expect(await coverSession(admin, "s1")).toMatchObject({ error: "LIVE_CLASS_INVALID_STATE" })
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })
})
