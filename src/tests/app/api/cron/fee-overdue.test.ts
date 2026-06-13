// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for fee-overdue cron — BUG-1 (per-school batching) and INV-003
 * (mirror OVERDUE status to linked UserInvoices).
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { GET } from "@/app/api/cron/fee-overdue/route"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    feeAssignment: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    userInvoice: {
      updateMany: vi.fn(),
    },
    fine: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue("notif-1"),
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

function makeRequest(secret?: string): Request {
  const headers = new Headers()
  if (secret) headers.set("authorization", `Bearer ${secret}`)
  return new Request("https://example.com/api/cron/fee-overdue", { headers })
}

// ── Auth ───────────────────────────────────────────────────────────────────

describe("fee-overdue cron — auth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "test-secret"
  })

  it("returns 401 when no Authorization header", async () => {
    const res = await GET(makeRequest() as any)
    expect(res.status).toBe(401)
  })

  it("returns 401 on wrong secret", async () => {
    const res = await GET(makeRequest("wrong") as any)
    expect(res.status).toBe(401)
  })

  it("proceeds when secret is correct", async () => {
    // No schools with active assignments — cron completes immediately.
    mockDb.feeAssignment.groupBy.mockResolvedValue([])
    const res = await GET(makeRequest("test-secret") as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ── BUG-1: per-school batching ─────────────────────────────────────────────

describe("fee-overdue cron — BUG-1 per-school batching", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "test-secret"
  })

  it("queries distinct schools first then processes each school separately", async () => {
    // Two schools with active assignments.
    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-a" },
      { schoolId: "school-b" },
    ] as any)

    // Each school has no pending/overdue assignments for simplicity.
    mockDb.feeAssignment.findMany.mockResolvedValue([])

    const res = await GET(makeRequest("test-secret") as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.schoolsProcessed).toBe(2)

    // groupBy must have been called (the BUG-1 fix).
    expect(mockDb.feeAssignment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ["schoolId"] })
    )
  })

  it("every findMany call for assignments includes the schoolId filter", async () => {
    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-x" },
    ] as any)
    mockDb.feeAssignment.findMany.mockResolvedValue([])

    await GET(makeRequest("test-secret") as any)

    // Both the PENDING and OVERDUE findMany calls must include schoolId.
    for (const call of mockDb.feeAssignment.findMany.mock.calls) {
      expect(call[0].where.schoolId).toBe("school-x")
    }
  })
})

// ── INV-003: mirror OVERDUE to UserInvoices ────────────────────────────────

describe("fee-overdue cron — INV-003 mirror to UserInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "test-secret"
  })

  it("calls userInvoice.updateMany for newly overdue assignment", async () => {
    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-1" },
    ] as any)

    // One PENDING assignment with an overdue schedule entry.
    const pastDate = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000
    ).toISOString()
    mockDb.feeAssignment.findMany.mockImplementation(({ where }: any) => {
      // Phase 1: PENDING/PARTIAL
      if (where.status?.in?.includes("PENDING")) {
        return Promise.resolve([
          {
            id: "fa-1",
            schoolId: "school-1",
            studentId: "student-1",
            finalAmount: { toString: () => "500" },
            status: "PENDING",
            feeStructure: {
              name: "Tuition",
              paymentSchedule: [{ dueDate: pastDate, amount: 500 }],
              lateFeeAmount: null,
              lateFeeType: null,
            },
          },
        ])
      }
      // Phase 2: OVERDUE
      return Promise.resolve([])
    })

    mockDb.feeAssignment.update.mockResolvedValue({} as any)
    mockDb.userInvoice.updateMany.mockResolvedValue({ count: 1 } as any)
    mockDb.student.findUnique.mockResolvedValue({
      userId: "user-1",
      studentGuardians: [],
    } as any)
    mockDb.school.findFirst.mockResolvedValue({
      preferredLanguage: "ar",
    } as any)
    mockDb.school.findUnique.mockResolvedValue({
      subdomain: "demo",
      domain: null,
    } as any)
    mockDb.notificationPreference.findUnique.mockResolvedValue(null)
    mockDb.notification.create.mockResolvedValue({ id: "n-1" } as any)

    const res = await GET(makeRequest("test-secret") as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.newlyOverdue).toBe(1)
    expect(body.invoicesMarkedOverdue).toBe(1)

    // Verify updateMany was called with correct filter (never downgrades PAID).
    expect(mockDb.userInvoice.updateMany).toHaveBeenCalledWith({
      where: {
        feeAssignmentId: "fa-1",
        schoolId: "school-1",
        status: { in: ["UNPAID", "PARTIAL"] },
      },
      data: { status: "OVERDUE" },
    })
  })

  it("does NOT call userInvoice.updateMany for assignments that are not newly overdue", async () => {
    mockDb.feeAssignment.groupBy.mockResolvedValue([
      { schoolId: "school-1" },
    ] as any)

    // PENDING assignment with a future due date (not overdue yet).
    const futureDate = new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000
    ).toISOString()
    mockDb.feeAssignment.findMany.mockImplementation(({ where }: any) => {
      if (where.status?.in?.includes("PENDING")) {
        return Promise.resolve([
          {
            id: "fa-2",
            schoolId: "school-1",
            studentId: "student-1",
            finalAmount: { toString: () => "300" },
            status: "PENDING",
            feeStructure: {
              name: "Books",
              paymentSchedule: [{ dueDate: futureDate, amount: 300 }],
              lateFeeAmount: null,
              lateFeeType: null,
            },
          },
        ])
      }
      return Promise.resolve([])
    })

    const res = await GET(makeRequest("test-secret") as any)
    expect(res.status).toBe(200)
    expect(mockDb.userInvoice.updateMany).not.toHaveBeenCalled()
  })
})
