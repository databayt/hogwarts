// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for the fee-due cron:
 *  - Auth gate
 *  - Per-school batching
 *  - FeeAssignment due-soon reminders
 *  - UserInvoice due-soon reminders (deduped against FeeAssignment)
 *  - Offer-expiry reminders (userId path + directEmail fallback)
 *  - Idempotency (no double-send on same day)
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { GET } from "@/app/api/cron/fee-due/route"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    feeAssignment: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    userInvoice: {
      findMany: vi.fn(),
    },
    application: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    notification: {
      findFirst: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue("notif-sent"),
  resolveActionUrl: vi.fn((path: string) => `https://demo.databayt.org${path}`),
}))

vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("next/server", async () => {
  const real =
    await vi.importActual<typeof import("next/server")>("next/server")
  return {
    ...real,
    NextResponse: {
      json: (data: unknown, init?: { status?: number }) =>
        new Response(JSON.stringify(data), { status: init?.status ?? 200 }),
    },
  }
})

const mockDb = vi.mocked(db)
const mockDispatch = vi.mocked(dispatchNotification)

function makeRequest(secret?: string): Request {
  const headers = new Headers()
  if (secret) headers.set("authorization", `Bearer ${secret}`)
  return new Request("https://example.com/api/cron/fee-due", { headers })
}

/** Returns a date N days from now. */
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000)
}

// ── Auth ───────────────────────────────────────────────────────────────────

describe("fee-due cron — auth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "secret"
    // Part C (auto-expire) runs for every processed school — default: no rows
    mockDb.application.updateMany.mockResolvedValue({ count: 0 } as any)
  })

  it("returns 401 with no Authorization header", async () => {
    const res = await GET(makeRequest() as any)
    expect(res.status).toBe(401)
  })

  it("returns 401 with wrong secret", async () => {
    const res = await GET(makeRequest("wrong") as any)
    expect(res.status).toBe(401)
  })

  it("returns 200 with correct secret and empty data", async () => {
    mockDb.feeAssignment.groupBy.mockResolvedValue([])
    mockDb.application.groupBy.mockResolvedValue([])
    const res = await GET(makeRequest("secret") as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ── Per-school batching ────────────────────────────────────────────────────

describe("fee-due cron — per-school batching", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "secret"
    // Part C (auto-expire) runs for every processed school — default: no rows
    mockDb.application.updateMany.mockResolvedValue({ count: 0 } as any)
  })

  it("iterates over distinct school IDs from both fee and offer groupBy", async () => {
    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-a" },
    ] as any)
    mockDb.application.groupBy.mockResolvedValue([
      { schoolId: "school-b" },
    ] as any)

    // Each school returns no assignments/invoices/offers.
    mockDb.feeAssignment.findMany.mockResolvedValue([])
    mockDb.userInvoice.findMany.mockResolvedValue([])
    mockDb.application.findMany.mockResolvedValue([])
    mockDb.school.findUnique.mockResolvedValue({
      preferredLanguage: "ar",
    } as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.schoolsProcessed).toBe(2)
  })

  it("deduplicates school IDs that appear in both groupBy results", async () => {
    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-a" },
    ] as any)
    mockDb.application.groupBy.mockResolvedValue([
      { schoolId: "school-a" },
    ] as any)

    mockDb.feeAssignment.findMany.mockResolvedValue([])
    mockDb.userInvoice.findMany.mockResolvedValue([])
    mockDb.application.findMany.mockResolvedValue([])
    mockDb.school.findUnique.mockResolvedValue({
      preferredLanguage: "ar",
    } as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.schoolsProcessed).toBe(1)
  })
})

// ── FeeAssignment due-soon reminders ──────────────────────────────────────

describe("fee-due cron — FeeAssignment reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "secret"
    // Part C (auto-expire) runs for every processed school — default: no rows
    mockDb.application.updateMany.mockResolvedValue({ count: 0 } as any)

    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-1" },
    ] as any)
    mockDb.application.groupBy.mockResolvedValue([])
    mockDb.school.findUnique.mockResolvedValue({
      preferredLanguage: "ar",
    } as any)
    mockDb.userInvoice.findMany.mockResolvedValue([])
    mockDb.application.findMany.mockResolvedValue([])
    // No recent notification (idempotency check returns null).
    mockDb.notification.findFirst.mockResolvedValue(null)
    mockDb.student.findUnique.mockResolvedValue({
      userId: "user-1",
      studentGuardians: [],
    } as any)
  })

  it("dispatches fee_due notification for PENDING assignment due within 7 days", async () => {
    const dueSoon = daysFromNow(3).toISOString()
    mockDb.feeAssignment.findMany.mockResolvedValue([
      {
        id: "fa-1",
        studentId: "student-1",
        finalAmount: { toString: () => "1000" },
        feeStructure: {
          name: "Tuition",
          paymentSchedule: [{ dueDate: dueSoon, amount: 1000 }],
        },
      },
    ] as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.feeAssignmentReminders).toBe(1)
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "fee_due",
        userId: "user-1",
        schoolId: "school-1",
        metadata: expect.objectContaining({ feeAssignmentId: "fa-1" }),
      })
    )
  })

  it("does NOT dispatch for assignment not due within 7 days", async () => {
    const farFuture = daysFromNow(14).toISOString()
    mockDb.feeAssignment.findMany.mockResolvedValue([
      {
        id: "fa-2",
        studentId: "student-1",
        finalAmount: { toString: () => "500" },
        feeStructure: {
          name: "Books",
          paymentSchedule: [{ dueDate: farFuture, amount: 500 }],
        },
      },
    ] as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.feeAssignmentReminders).toBe(0)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it("skips assignment when idempotency check finds existing notification today", async () => {
    const dueSoon = daysFromNow(2).toISOString()
    mockDb.feeAssignment.findMany.mockResolvedValue([
      {
        id: "fa-3",
        studentId: "student-1",
        finalAmount: { toString: () => "700" },
        feeStructure: {
          name: "Transport",
          paymentSchedule: [{ dueDate: dueSoon, amount: 700 }],
        },
      },
    ] as any)

    // Idempotency: already sent today.
    mockDb.notification.findFirst.mockResolvedValue({ id: "existing" } as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.feeAssignmentReminders).toBe(0)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it("dispatches to both student and guardian", async () => {
    const dueSoon = daysFromNow(1).toISOString()
    mockDb.feeAssignment.findMany.mockResolvedValue([
      {
        id: "fa-4",
        studentId: "student-1",
        finalAmount: { toString: () => "200" },
        feeStructure: {
          name: "Activity",
          paymentSchedule: [{ dueDate: dueSoon, amount: 200 }],
        },
      },
    ] as any)

    // Student has a guardian.
    mockDb.student.findUnique.mockResolvedValue({
      userId: "student-user",
      studentGuardians: [{ guardian: { userId: "guardian-user" } }],
    } as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.notificationsCreated).toBe(2)

    const dispatchCalls = mockDispatch.mock.calls
    const recipientIds = dispatchCalls.map((c) => c[0].userId)
    expect(recipientIds).toContain("student-user")
    expect(recipientIds).toContain("guardian-user")
  })
})

// ── UserInvoice due-soon reminders ────────────────────────────────────────

describe("fee-due cron — UserInvoice reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "secret"
    // Part C (auto-expire) runs for every processed school — default: no rows
    mockDb.application.updateMany.mockResolvedValue({ count: 0 } as any)

    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-1" },
    ] as any)
    mockDb.application.groupBy.mockResolvedValue([])
    mockDb.school.findUnique.mockResolvedValue({
      preferredLanguage: "en",
    } as any)
    mockDb.feeAssignment.findMany.mockResolvedValue([])
    mockDb.application.findMany.mockResolvedValue([])
    mockDb.notification.findFirst.mockResolvedValue(null)
  })

  it("dispatches fee_due for invoice due within window", async () => {
    mockDb.userInvoice.findMany.mockResolvedValue([
      {
        id: "inv-1",
        invoice_no: "INV-001",
        due_date: daysFromNow(4),
        total: { toString: () => "800" },
        userId: "user-2",
        feeAssignmentId: null,
      },
    ] as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.invoiceReminders).toBe(1)
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "fee_due",
        userId: "user-2",
        metadata: expect.objectContaining({ invoiceId: "inv-1" }),
      })
    )
  })

  it("skips invoice already handled via its linked FeeAssignment", async () => {
    // feeAssignments returns one entry with id "fa-linked"
    const dueSoon = daysFromNow(3).toISOString()
    mockDb.feeAssignment.findMany.mockResolvedValue([
      {
        id: "fa-linked",
        studentId: "student-1",
        finalAmount: { toString: () => "900" },
        feeStructure: {
          name: "Lunch",
          paymentSchedule: [{ dueDate: dueSoon, amount: 900 }],
        },
      },
    ] as any)
    mockDb.student.findUnique.mockResolvedValue({
      userId: "u1",
      studentGuardians: [],
    } as any)

    // Invoice linked to the same FeeAssignment.
    mockDb.userInvoice.findMany.mockResolvedValue([
      {
        id: "inv-linked",
        invoice_no: "INV-002",
        due_date: daysFromNow(3),
        total: { toString: () => "900" },
        userId: "u1",
        feeAssignmentId: "fa-linked",
      },
    ] as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    // Only 1 reminder (from FeeAssignment), not 2 (invoice skipped).
    expect(body.feeAssignmentReminders).toBe(1)
    expect(body.invoiceReminders).toBe(0)
  })
})

// ── Offer expiry reminders ─────────────────────────────────────────────────

describe("fee-due cron — offer expiry reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "secret"
    // Part C (auto-expire) runs for every processed school — default: no rows
    mockDb.application.updateMany.mockResolvedValue({ count: 0 } as any)

    mockDb.feeAssignment.groupBy.mockResolvedValue([])
    mockDb.application.groupBy.mockResolvedValue([
      { schoolId: "school-1" },
    ] as any)
    mockDb.school.findUnique.mockResolvedValue({
      preferredLanguage: "ar",
    } as any)
    mockDb.feeAssignment.findMany.mockResolvedValue([])
    mockDb.userInvoice.findMany.mockResolvedValue([])
    mockDb.notification.findFirst.mockResolvedValue(null)
  })

  it("dispatches system_alert to linked userId when offer expires within 3 days", async () => {
    mockDb.application.findMany.mockResolvedValue([
      {
        id: "app-1",
        applicationNumber: "APP-001",
        firstName: "Ahmed",
        lastName: "Ali",
        email: "ahmed@example.com",
        userId: "user-app",
        accessToken: "tok-abc",
        offerExpiryDate: daysFromNow(2),
      },
    ] as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.offerExpiryReminders).toBe(1)
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "system_alert",
        userId: "user-app",
        schoolId: "school-1",
        metadata: expect.objectContaining({
          applicationId: "app-1",
          action: "offer_expiry_reminder",
        }),
      })
    )
  })

  it("uses directEmail fallback for guest applicant with no userId (BUG-3)", async () => {
    mockDb.application.findMany.mockResolvedValue([
      {
        id: "app-2",
        applicationNumber: "APP-002",
        firstName: "Sara",
        lastName: "Omar",
        email: "sara@example.com",
        userId: null,
        accessToken: "tok-xyz",
        offerExpiryDate: daysFromNow(1),
      },
    ] as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.offerExpiryReminders).toBe(1)
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        directEmail: "sara@example.com",
        channels: ["email"],
      })
    )
  })

  it("skips offer expiry already alerted today (idempotency)", async () => {
    mockDb.application.findMany.mockResolvedValue([
      {
        id: "app-3",
        applicationNumber: "APP-003",
        firstName: "Ali",
        lastName: "Hassan",
        email: "ali@example.com",
        userId: "user-3",
        accessToken: "tok-333",
        offerExpiryDate: daysFromNow(2),
      },
    ] as any)

    // Already sent today.
    mockDb.notification.findFirst.mockResolvedValue({ id: "existing" } as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.offerExpiryReminders).toBe(0)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it("does not dispatch when offer expires outside the 3-day window", async () => {
    mockDb.application.findMany.mockResolvedValue([
      {
        id: "app-4",
        applicationNumber: "APP-004",
        firstName: "Omar",
        lastName: "Nour",
        email: "omar@example.com",
        userId: "user-4",
        accessToken: "tok-444",
        // The DB query already filters offerExpiryDate <= offerWindowEnd,
        // so this case tests that the cron's groupBy + findMany pair
        // is consistent — findMany returns empty, dispatch not called.
        offerExpiryDate: daysFromNow(5),
      },
    ] as any)

    // Simulate that no offers fall in the window by returning empty.
    mockDb.application.findMany.mockResolvedValue([])

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()
    expect(body.offerExpiryReminders).toBe(0)
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})

// ── Part C: auto-expire lapsed offers ───────────────────────────────────────

describe("fee-due cron — auto-expire lapsed offers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "secret"
    mockDb.application.updateMany.mockResolvedValue({ count: 0 } as any)
    mockDb.feeAssignment.findMany.mockResolvedValue([])
    mockDb.userInvoice.findMany.mockResolvedValue([])
    mockDb.application.findMany.mockResolvedValue([])
    mockDb.notification.findFirst.mockResolvedValue(null as any)
    mockDb.school.findUnique.mockResolvedValue({
      preferredLanguage: "ar",
    } as any)
  })

  it("visits schools whose only work is a lapsed offer and flips them to EXPIRED", async () => {
    mockDb.feeAssignment.groupBy.mockResolvedValue([] as any)
    mockDb.application.groupBy
      // 1st groupBy: upcoming-expiry reminder set (empty)
      .mockResolvedValueOnce([] as any)
      // 2nd groupBy: already-lapsed set — this school has no other work
      .mockResolvedValueOnce([{ schoolId: "school-lapsed" }] as any)
    mockDb.application.updateMany.mockResolvedValue({ count: 3 } as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()

    expect(body.schoolsProcessed).toBe(1)
    expect(body.offersExpired).toBe(3)
    // The flip only ever targets SELECTED rows already past their expiry —
    // never future-dated offers.
    expect(mockDb.application.updateMany).toHaveBeenCalledWith({
      where: {
        schoolId: "school-lapsed",
        status: "SELECTED",
        offerExpiryDate: { lt: expect.any(Date) },
      },
      data: { status: "EXPIRED" },
    })
  })

  it("reports zero when nothing lapsed", async () => {
    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-a" },
    ] as any)
    mockDb.application.groupBy.mockResolvedValue([] as any)

    const res = await GET(makeRequest("secret") as any)
    const body = await res.json()

    expect(body.offersExpired).toBe(0)
  })
})
