// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

const { loadUpcomingData, loadTodaySchedule, resolveActiveTerm } = vi.hoisted(
  () => ({
    loadUpcomingData: vi.fn(),
    loadTodaySchedule: vi.fn(),
    resolveActiveTerm: vi.fn(),
  })
)

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    notification: { count: vi.fn() },
    announcement: { count: vi.fn() },
    conversationParticipant: { aggregate: vi.fn() },
    student: { findFirst: vi.fn(), count: vi.fn() },
    teacher: { findFirst: vi.fn(), count: vi.fn() },
    guardian: { findFirst: vi.fn() },
    studentGuardian: { count: vi.fn() },
    section: { count: vi.fn() },
    attendance: { count: vi.fn() },
    schoolExam: { count: vi.fn() },
    timetable: { count: vi.fn(), findMany: vi.fn() },
    payment: { aggregate: vi.fn() },
    event: { count: vi.fn() },
  },
}))

vi.mock("@/components/school-dashboard/dashboard/upcoming-queries", () => ({
  loadUpcomingData,
}))
vi.mock("@/components/school-dashboard/timetable/today-schedule", () => ({
  loadTodaySchedule,
}))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm }))

vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"
const USER = "user-1"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

function get() {
  return new NextRequest("http://localhost/api/mobile/dashboard", {
    headers: { Authorization: "Bearer test" },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    id: SCHOOL,
    name: "مدرسة",
    nameEn: "School",
    logoUrl: "https://cdn/logo.png",
    enabledModules: ["attendance", "finance"],
  } as never)
  vi.mocked(db.user.findUnique).mockResolvedValue({
    username: "Test",
    image: null,
  } as never)
  vi.mocked(db.notification.count).mockResolvedValue(3)
  vi.mocked(db.announcement.count).mockResolvedValue(2)
  vi.mocked(db.conversationParticipant.aggregate).mockResolvedValue({
    _sum: { unreadCount: 7 },
  } as never)
  vi.mocked(db.attendance.count).mockResolvedValue(0)
  vi.mocked(db.schoolExam.count).mockResolvedValue(0)
  vi.mocked(db.timetable.count).mockResolvedValue(0)
  loadUpcomingData.mockResolvedValue(null)
  resolveActiveTerm.mockResolvedValue({ term: null, source: "none" })
  loadTodaySchedule.mockResolvedValue({
    schedule: [],
    dayOfWeek: 1,
    message: "No active term",
  })
})

describe("GET /api/mobile/dashboard", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/dashboard/route")
    expect((await GET(get())).status).toBe(401)
  })

  it("keeps the original flat fields and adds school, unread_messages, quick_actions", async () => {
    await authAs("GUARDIAN")
    vi.mocked(db.guardian.findFirst).mockResolvedValue({ id: "g1" } as never)
    vi.mocked(db.studentGuardian.count).mockResolvedValue(2)
    vi.mocked(db.event.count).mockResolvedValue(4)
    const { GET } = await import("@/app/api/mobile/dashboard/route")
    const body = await (await GET(get())).json()

    expect(body.events_today).toBe(4)
    expect(db.event.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        schoolId: SCHOOL,
        status: { not: "CANCELLED" },
      }),
    })
    expect(body).toMatchObject({
      user_name: "Test",
      role: "GUARDIAN",
      school_name: "School",
      unread_notifications: 3,
      announcements_count: 2,
      children_count: 2,
      school: {
        id: SCHOOL,
        name: "مدرسة",
        name_en: "School",
        logo_url: "https://cdn/logo.png",
        enabled_modules: ["attendance", "finance"],
      },
      unread_messages: 7,
      next_actions: [],
      today_timetable: null,
    })
    expect(body.quick_actions[0]).toEqual({
      key: "parents",
      label: "My Children",
      description: expect.any(String),
      href: "/parents",
      icon: expect.any(String),
    })
    // Tenant scoping on the shared reads.
    expect(db.school.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: SCHOOL } })
    )
    expect(db.conversationParticipant.aggregate).toHaveBeenCalledWith({
      where: {
        userId: USER,
        isActive: true,
        conversation: { schoolId: SCHOOL },
      },
      _sum: { unreadCount: true },
    })
    expect(loadUpcomingData).toHaveBeenCalledWith(USER, SCHOOL, "GUARDIAN")
  })

  it("enabled_modules is null when the school never configured modules", async () => {
    await authAs("STAFF")
    vi.mocked(db.school.findUnique).mockResolvedValue({
      id: SCHOOL,
      name: "S",
      nameEn: null,
      logoUrl: null,
      enabledModules: { attendanceMethods: ["MANUAL"] },
    } as never)
    vi.mocked(db.student.count).mockResolvedValue(10)
    vi.mocked(db.event.count).mockResolvedValue(1)
    const { GET } = await import("@/app/api/mobile/dashboard/route")
    const body = await (await GET(get())).json()
    expect(body.school.enabled_modules).toBeNull()
    expect(body).toMatchObject({
      total_students: 10,
      present_today: 0,
      upcoming_events: 1,
    })
  })

  it("ranks next_actions from the shared upcoming payload (student)", async () => {
    await authAs("STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "s1",
      sectionId: "sec1",
    } as never)
    loadUpcomingData.mockResolvedValue({
      assignments: [
        {
          id: "a1",
          title: "Essay",
          subject: "Arabic",
          isOverdue: true,
          status: "not_submitted",
        },
      ],
      nextClass: { subject: "Math", time: "08:00", room: "1" },
    })
    const { GET } = await import("@/app/api/mobile/dashboard/route")
    const body = await (await GET(get())).json()
    expect(body.next_actions).toEqual([
      { kind: "assignmentOverdue", mark: "Essay", href: "/my-assignments" },
      { kind: "nextClass", mark: "Math", href: "/timetable" },
    ])
  })

  it("returns today_timetable for a teacher via the shared day loader", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.timetable.findMany).mockResolvedValue([])
    resolveActiveTerm.mockResolvedValue({
      term: { id: "term1", yearId: "y1" },
      source: "explicit",
    })
    loadTodaySchedule.mockResolvedValue({
      dayOfWeek: 1,
      date: "2026-09-14T00:00:00.000Z",
      termLabel: "",
      closure: null,
      schedule: [
        {
          periodId: "p1",
          periodName: "Period 1",
          startTime: "1970-01-01T08:00:00.000Z",
          endTime: "1970-01-01T08:45:00.000Z",
          subject: "Math",
          className: "10A",
          teacher: "T One",
          room: "R1",
          sectionId: "sec1",
          subjectId: "sub1",
          timetableId: "tt1",
          isBreak: false,
          liveClass: {
            sessionId: "ls1",
            provider: "livekit",
            meetingUrl: null,
            status: "LIVE",
          },
        },
      ],
    })
    const { GET } = await import("@/app/api/mobile/dashboard/route")
    const body = await (await GET(get())).json()
    expect(loadTodaySchedule).toHaveBeenCalledWith({
      schoolId: SCHOOL,
      userId: USER,
      role: "TEACHER",
      term: { id: "term1", yearId: "y1", label: "" },
    })
    expect(body.today_timetable).toEqual({
      day_of_week: 1,
      date: "2026-09-14T00:00:00.000Z",
      closure: null,
      periods: [
        {
          period_id: "p1",
          period_name: "Period 1",
          start_time: "1970-01-01T08:00:00.000Z",
          end_time: "1970-01-01T08:45:00.000Z",
          subject: "Math",
          class_name: "10A",
          section_id: "sec1",
          teacher: "T One",
          room: "R1",
          is_break: false,
          timetable_id: "tt1",
          live_class: {
            session_id: "ls1",
            provider: "livekit",
            meeting_url: null,
            status: "LIVE",
          },
        },
      ],
    })
  })

  it("accountant stats come from the invoice counts + today's collections", async () => {
    await authAs("ACCOUNTANT")
    loadUpcomingData.mockResolvedValue({
      pendingPayments: { count: 4, totalAmount: 400 },
      overdueInvoices: { count: 2, totalAmount: 150 },
    })
    vi.mocked(db.payment.aggregate).mockResolvedValue({
      _sum: { amount: 90 },
    } as never)
    const { GET } = await import("@/app/api/mobile/dashboard/route")
    const body = await (await GET(get())).json()
    expect(body).toMatchObject({
      pending_invoices: 4,
      pending_amount: 400,
      overdue_invoices: 2,
      overdue_amount: 150,
      collected_today: 90,
    })
    expect(body.next_actions.map((a: { kind: string }) => a.kind)).toEqual([
      "overdueInvoices",
      "pendingPayments",
    ])
  })

  it("DEVELOPER gets the admin stats branch", async () => {
    await authAs("DEVELOPER")
    vi.mocked(db.student.count).mockResolvedValue(5)
    vi.mocked(db.teacher.count).mockResolvedValue(2)
    vi.mocked(db.section.count).mockResolvedValue(3)
    const { GET } = await import("@/app/api/mobile/dashboard/route")
    const body = await (await GET(get())).json()
    expect(body).toMatchObject({
      total_students: 5,
      total_teachers: 2,
      total_classes: 3,
    })
  })
})
