// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import { GET } from "@/app/api/cron/live-class-no-show/route"

vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findMany: vi.fn() },
    notification: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    liveClassSupervisor: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotificationsToAudience: vi.fn(async () => ({ created: 2 })),
}))
vi.mock("@/components/translation/person", () => ({
  getLabels: vi.fn(async () => new Map()),
}))

const NOW = new Date("2026-11-22T09:10:00Z").getTime()
const req = () => new Request("http://localhost/api/cron/live-class-no-show")

const row = (over: Record<string, unknown> = {}) => ({
  id: "s1",
  schoolId: "school-a",
  status: "scheduled",
  isPractice: false,
  title: "Math",
  scheduledStart: new Date("2026-11-22T09:00:00Z"),
  scheduledEnd: new Date("2026-11-22T09:45:00Z"),
  coveredByUserId: null,
  subject: { name: "الرياضيات" },
  section: {
    name: "3 أ",
    grade: {
      name: "الصف الثالث الابتدائي",
      gradeNumber: 3,
      level: { name: "المرحلة الابتدائية", level: "ELEMENTARY" },
      yearLevel: null,
    },
  },
  school: { timezone: "Africa/Khartoum", preferredLanguage: "ar" },
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  vi.mocked(isAuthorizedCron).mockReturnValue(true)
  vi.mocked(db.conference.findMany).mockResolvedValue([row()] as never)
  vi.mocked(db.notification.findMany).mockResolvedValue([] as never)
  vi.mocked(db.user.findMany).mockResolvedValue([
    { id: "admin-1", schoolId: "school-a" },
  ] as never)
  vi.mocked(db.liveClassSupervisor.findMany).mockResolvedValue([
    { schoolId: "school-a", userId: "sup-primary", stage: "primary" },
    { schoolId: "school-a", userId: "sup-secondary", stage: "secondary" },
    { schoolId: "school-b", userId: "sup-other-school", stage: "primary" },
  ] as never)
})
afterEach(() => vi.useRealTimers())

describe("live-class-no-show cron", () => {
  it("returns 401 when not authorized and reads nothing", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(false)
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(db.conference.findMany).not.toHaveBeenCalled()
  })

  it("looks for timetable classes five minutes in, with no teacher, not covered, not practice", async () => {
    await GET(req())
    const where = vi.mocked(db.conference.findMany).mock.calls[0][0]!.where as Record<string, any>
    expect(where.scheduledStart.lte.getTime()).toBe(NOW - 5 * 60_000)
    expect(where.scheduledEnd).toEqual({ gt: new Date(NOW) })
    expect(where.isPractice).toBe(false)
    expect(where.coveredByUserId).toBeNull()
    expect(where.status).toEqual({ in: ["scheduled", "live"] })
    expect(where.participants).toEqual({
      none: { role: { in: ["HOST", "CO_HOST"] }, joinedAt: { not: null } },
    })
  })

  it("tells the school's admins and the supervisors of the class's stage, in Arabic, with the cover link", async () => {
    const res = await GET(req())
    expect(await res.json()).toMatchObject({ ok: true, alerted: 1, notices: 2 })
    expect(dispatchNotificationsToAudience).toHaveBeenCalledTimes(1)
    const call = vi.mocked(dispatchNotificationsToAudience).mock.calls[0][0]
    expect(call.type).toBe("live_class_no_teacher")
    expect(call.targetUserIds).toEqual(["admin-1", "sup-primary"])
    expect(call.channels).toEqual(["in_app", "push"])
    expect(call.title).toBe("حصة بلا معلم")
    expect(call.body).toContain("الرياضيات · 3 أ")
    expect(call.body).toContain("ولم يدخل المعلم")
    expect(call.metadata).toMatchObject({
      sessionId: "s1",
      deep_link: "/live/s1/cover",
    })
  })

  it("speaks English to an English school", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      row({ school: { timezone: "Africa/Khartoum", preferredLanguage: "en" } }),
    ] as never)
    await GET(req())
    expect(vi.mocked(dispatchNotificationsToAudience).mock.calls[0][0].title).toBe(
      "Class without a teacher"
    )
  })

  it("is once per class: a session that already has a notice sends nothing", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([
      { metadata: { sessionId: "s1" } },
    ] as never)
    const res = await GET(req())
    expect(await res.json()).toMatchObject({ alerted: 0 })
    expect(dispatchNotificationsToAudience).not.toHaveBeenCalled()
  })

  it("does nothing when no class qualifies", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
    const res = await GET(req())
    expect(await res.json()).toMatchObject({ ok: true, candidates: 0 })
    expect(db.notification.findMany).not.toHaveBeenCalled()
  })
})
