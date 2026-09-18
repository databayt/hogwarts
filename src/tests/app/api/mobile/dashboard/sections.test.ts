// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// The real dashboard/queries.ts runs against a mocked db, so the route is
// tested through the same loaders the web's ResourceUsageSection and
// InvoiceHistorySection read.
vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn(), count: vi.fn() },
    teacher: { findFirst: vi.fn(), count: vi.fn() },
    user: { count: vi.fn() },
    school: { count: vi.fn() },
    class: { findMany: vi.fn() },
    studentClass: { count: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
    assignmentSubmission: { count: vi.fn() },
    schoolAssignment: { count: vi.fn() },
    examResult: { findMany: vi.fn() },
    schoolExam: { findFirst: vi.fn() },
    attendance: { count: vi.fn() },
    event: { count: vi.fn() },
    userInvoice: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
    expense: { findMany: vi.fn() },
    feeAssignment: { aggregate: vi.fn() },
    payment: { aggregate: vi.fn() },
  },
}))

vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"
const OTHER_SCHOOL = "school-2"
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

const get = () =>
  new NextRequest("http://localhost/api/mobile/dashboard/sections", {
    headers: { Authorization: "Bearer test" },
  })

async function call() {
  const { GET } = await import("@/app/api/mobile/dashboard/sections/route")
  return GET(get())
}

/** Every `where` a mocked Prisma method was handed, flattened. */
function everyWhere() {
  const out: Array<Record<string, unknown>> = []
  for (const model of Object.values(db) as Array<Record<string, unknown>>) {
    for (const method of Object.values(model)) {
      const mock = vi.mocked(method as (...args: unknown[]) => unknown)
      if (!mock.mock) continue
      for (const [arg] of mock.mock.calls) {
        const where = (arg as { where?: Record<string, unknown> })?.where
        if (where) out.push(where)
      }
    }
  }
  return out
}

const emptyAggregate = { _sum: {}, _count: 0 } as never

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.student.findFirst).mockResolvedValue(null)
  vi.mocked(db.student.count).mockResolvedValue(0)
  vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
  vi.mocked(db.teacher.count).mockResolvedValue(0)
  vi.mocked(db.user.count).mockResolvedValue(0)
  vi.mocked(db.school.count).mockResolvedValue(0)
  vi.mocked(db.class.findMany).mockResolvedValue([])
  vi.mocked(db.studentClass.count).mockResolvedValue(0)
  vi.mocked(db.studentGuardian.findMany).mockResolvedValue([])
  vi.mocked(db.assignmentSubmission.count).mockResolvedValue(0)
  vi.mocked(db.schoolAssignment.count).mockResolvedValue(0)
  vi.mocked(db.examResult.findMany).mockResolvedValue([])
  vi.mocked(db.schoolExam.findFirst).mockResolvedValue(null)
  vi.mocked(db.attendance.count).mockResolvedValue(0)
  vi.mocked(db.event.count).mockResolvedValue(0)
  vi.mocked(db.userInvoice.findMany).mockResolvedValue([])
  vi.mocked(db.userInvoice.count).mockResolvedValue(0)
  vi.mocked(db.userInvoice.aggregate).mockResolvedValue(emptyAggregate)
  vi.mocked(db.expense.findMany).mockResolvedValue([])
  vi.mocked(db.feeAssignment.aggregate).mockResolvedValue(emptyAggregate)
  vi.mocked(db.payment.aggregate).mockResolvedValue(emptyAggregate)
})

describe("GET /api/mobile/dashboard/sections", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    expect((await call()).status).toBe(401)
    expect(db.userInvoice.findMany).not.toHaveBeenCalled()
  })

  it("every role gets 200 and both arrays", async () => {
    for (const role of [
      "STUDENT",
      "TEACHER",
      "GUARDIAN",
      "STAFF",
      "ACCOUNTANT",
      "ADMIN",
      "DEVELOPER",
      "PRINCIPAL",
    ]) {
      vi.clearAllMocks()
      await authAs(role)
      const res = await call()
      expect(res.status, role).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.resource_usage), role).toBe(true)
      expect(Array.isArray(body.invoices), role).toBe(true)
    }
  })

  it("a role the web renders no sections for gets empty arrays, not the school's billing", async () => {
    await authAs("USER")
    const body = await (await call()).json()
    expect(body).toEqual({ resource_usage: [], invoices: [] })
    // The ADMIN fall-through would have read every invoice in the school.
    expect(db.userInvoice.findMany).not.toHaveBeenCalled()
  })

  it("STUDENT: no student row means no rows, never invented ones", async () => {
    await authAs("STUDENT")
    const body = await (await call()).json()
    expect(body.resource_usage).toEqual([])
    expect(body.invoices).toEqual([])
  })

  it("STUDENT: the academic rows with their dictionary keys and percents", async () => {
    await authAs("STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as never)
    vi.mocked(db.assignmentSubmission.count).mockResolvedValue(9)
    vi.mocked(db.schoolAssignment.count).mockResolvedValue(18)
    vi.mocked(db.examResult.findMany).mockResolvedValue([
      { percentage: 80 },
      { percentage: 90 },
    ] as never)
    const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
      examDate: inTenDays,
    } as never)
    vi.mocked(db.userInvoice.findMany).mockResolvedValue([
      {
        id: "inv1",
        invoice_no: "ENR-001",
        invoice_date: new Date("2026-09-05T00:00:00.000Z"),
        total: 1250,
        status: "PAID",
      },
    ] as never)

    const body = await (await call()).json()

    expect(body.resource_usage).toEqual([
      {
        key: "assignmentProgress",
        name: "Assignment Progress",
        used: 9,
        limit: 18,
        unit: "completed",
        percent: 50,
      },
      {
        key: "currentGpa",
        name: "Current GPA",
        used: 3.4,
        limit: 4,
        unit: "",
        percent: 85,
      },
      {
        key: "daysUntilExams",
        name: "Days Until Exams",
        used: 10,
        limit: 60,
        unit: "days",
        percent: 17,
      },
    ])
    expect(body.invoices).toEqual([
      {
        id: "inv1",
        date: "2026-09-05T00:00:00.000Z",
        description: "Invoice #ENR-001",
        amount: 1250,
        currency: "USD",
        status: "paid",
      },
    ])
  })

  it("TEACHER: the workload rows and expense claims", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.class.findMany).mockResolvedValue([{ id: "c1" }] as never)
    vi.mocked(db.assignmentSubmission.count).mockResolvedValue(10)
    vi.mocked(db.studentClass.count).mockResolvedValue(90)
    vi.mocked(db.attendance.count).mockResolvedValue(225)
    vi.mocked(db.expense.findMany).mockResolvedValue([
      {
        id: "e1",
        expenseNumber: "EXP-9",
        expenseDate: new Date("2026-08-01T00:00:00.000Z"),
        amount: 40.5,
        status: "APPROVED",
        description: "Lab consumables",
      },
    ] as never)

    const body = await (await call()).json()

    expect(body.resource_usage.map((r: { key: string }) => r.key)).toEqual([
      "lessonsThisWeek",
      "ungradedWork",
      "classCoverage",
      "attendanceMarked",
    ])
    expect(body.resource_usage[1]).toMatchObject({ used: 10, percent: 20 })
    expect(body.resource_usage[2]).toMatchObject({ used: 90, percent: 50 })
    // 225 marks against 90 students × 5 days = 50%.
    expect(body.resource_usage[3]).toMatchObject({
      used: 50,
      limit: 100,
      percent: 50,
    })
    expect(body.invoices).toEqual([
      {
        id: "e1",
        date: "2026-08-01T00:00:00.000Z",
        description: "Lab consumables",
        amount: 40.5,
        currency: "USD",
        status: "open",
      },
    ])
  })

  it("GUARDIAN: the children rows, zeroed when nothing is linked", async () => {
    await authAs("GUARDIAN")
    const body = await (await call()).json()
    expect(body.resource_usage).toEqual([
      {
        key: "childrenEnrolled",
        name: "Children Enrolled",
        used: 0,
        limit: 5,
        unit: "children",
        percent: 0,
      },
      {
        key: "avgAttendance",
        name: "Avg Attendance",
        used: 0,
        limit: 100,
        unit: "%",
        percent: 0,
      },
      {
        key: "assignmentsDue",
        name: "Assignments Due",
        used: 0,
        limit: 15,
        unit: "tasks",
        percent: 0,
      },
      {
        key: "upcomingEvents",
        name: "Upcoming Events",
        used: 0,
        limit: 10,
        unit: "events",
        percent: 0,
      },
    ])
    expect(body.invoices).toEqual([])
  })

  it("STAFF: work rows, and expense claims rather than school billing", async () => {
    await authAs("STAFF")
    const body = await (await call()).json()
    expect(body.resource_usage.map((r: { key: string }) => r.key)).toEqual([
      "tasksAssigned",
      "requestsPending",
      "daysThisMonth",
      "efficiencyScore",
    ])
    expect(db.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: SCHOOL, submittedBy: USER },
      })
    )
    expect(db.userInvoice.findMany).not.toHaveBeenCalled()
  })

  it("ACCOUNTANT: the finance rows off the shared fee metrics", async () => {
    await authAs("ACCOUNTANT")
    vi.mocked(db.feeAssignment.aggregate).mockResolvedValue({
      _sum: { finalAmount: 1000 },
      _count: 2,
    } as never)
    vi.mocked(db.payment.aggregate).mockResolvedValue({
      _sum: { amount: 750 },
      _count: 3,
    } as never)
    vi.mocked(db.userInvoice.count).mockResolvedValue(12)
    vi.mocked(db.userInvoice.aggregate).mockResolvedValue({
      _sum: { total: 6000 },
    } as never)

    const body = await (await call()).json()
    expect(body.resource_usage).toEqual([
      {
        key: "collectionRate",
        name: "Collection Rate",
        used: 75,
        limit: 100,
        unit: "%",
        percent: 75,
      },
      {
        key: "pendingInvoices",
        name: "Pending Invoices",
        used: 12,
        limit: 200,
        unit: "invoices",
        percent: 6,
      },
      {
        key: "monthlyRevenue",
        name: "Monthly Revenue",
        used: 6000,
        limit: 120000,
        unit: "SAR",
        percent: 5,
      },
      {
        key: "overdueAmount",
        name: "Overdue Amount",
        used: 6000,
        limit: 50000,
        unit: "SAR",
        percent: 12,
      },
    ])
  })

  it("ADMIN: the system rows and the school's billing", async () => {
    await authAs("ADMIN")
    vi.mocked(db.user.count).mockResolvedValue(500)
    vi.mocked(db.userInvoice.findMany).mockResolvedValue([
      {
        id: "inv9",
        invoice_no: "S-9",
        invoice_date: new Date("2026-07-01T00:00:00.000Z"),
        total: 99,
        status: "OPEN",
      },
    ] as never)

    const body = await (await call()).json()
    expect(body.resource_usage).toEqual([
      {
        key: "activeUsers",
        name: "Active Users",
        used: 500,
        limit: 2000,
        unit: "users",
        percent: 25,
      },
      {
        key: "storageUsed",
        name: "Storage Used",
        used: 45,
        limit: 100,
        unit: "GB",
        percent: 45,
      },
      {
        key: "activeSessions",
        name: "Active Sessions",
        used: 60,
        limit: 500,
        unit: "sessions",
        percent: 12,
      },
      {
        key: "systemHealth",
        name: "System Health",
        used: 98,
        limit: 100,
        unit: "%",
        percent: 98,
      },
    ])
    expect(body.invoices[0]).toMatchObject({ id: "inv9", status: "open" })
  })

  it("DEVELOPER: platform-wide rows, school-scoped invoices", async () => {
    await authAs("DEVELOPER")
    vi.mocked(db.school.count).mockResolvedValue(7)
    vi.mocked(db.user.count).mockResolvedValue(2500)
    const body = await (await call()).json()
    expect(body.resource_usage.map((r: { key: string }) => r.key)).toEqual([
      "schoolsActive",
      "platformUsers",
      "databaseSize",
      "systemUptime",
    ])
    expect(body.resource_usage[0]).toMatchObject({ used: 7, percent: 7 })
    // The platform counts are deliberately unscoped — that is the web's
    // DEVELOPER view. The invoice read is still the caller's school.
    expect(db.school.count).toHaveBeenCalledWith()
    expect(db.userInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: SCHOOL } })
    )
  })

  it("scopes every school read to the token's school, never another tenant", async () => {
    for (const role of [
      "STUDENT",
      "TEACHER",
      "GUARDIAN",
      "STAFF",
      "ACCOUNTANT",
      "ADMIN",
      "PRINCIPAL",
    ]) {
      vi.clearAllMocks()
      await authAs(role)
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as never)
      vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
      vi.mocked(db.class.findMany).mockResolvedValue([])
      await call()

      const wheres = everyWhere()
      expect(wheres.length, role).toBeGreaterThan(0)
      for (const where of wheres) {
        expect(JSON.stringify(where), role).not.toContain(OTHER_SCHOOL)
        // Every read either names the school directly or reaches it through a
        // relation that does (`class: { teacherId, schoolId }`).
        expect(JSON.stringify(where), `${role} ${JSON.stringify(where)}`).toContain(
          SCHOOL
        )
      }
    }
  })
})
