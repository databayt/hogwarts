// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { ensureInvoicesForAssignment } from "@/lib/fee-invoice-sync"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    userInvoice: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    feeAssignment: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    userInvoiceAddress: {
      create: vi.fn(),
    },
  },
}))

const SCHOOL_ID = "s1"
const FEE_ASSIGNMENT_ID = "fa-1"

function setupSchool() {
  vi.mocked(db.school.findUnique).mockResolvedValue({
    name: "Hogwarts",
    address: "Castle 1",
    currency: "USD",
  } as never)
}

function setupAddresses() {
  vi.mocked(db.userInvoiceAddress.create)
    .mockResolvedValueOnce({ id: "addr-from" } as never)
    .mockResolvedValueOnce({ id: "addr-to" } as never)
    .mockResolvedValueOnce({ id: "addr-from-2" } as never)
    .mockResolvedValueOnce({ id: "addr-to-2" } as never)
    .mockResolvedValueOnce({ id: "addr-from-3" } as never)
    .mockResolvedValueOnce({ id: "addr-to-3" } as never)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ensureInvoicesForAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
  })

  it("idempotency: returns 0 when invoices already exist for the assignment", async () => {
    vi.mocked(db.userInvoice.count).mockResolvedValue(1)

    const result = await ensureInvoicesForAssignment(
      SCHOOL_ID,
      FEE_ASSIGNMENT_ID
    )

    expect(result.invoicesCreated).toBe(0)
    expect(db.userInvoice.create).not.toHaveBeenCalled()
  })

  it("returns 0 when assignment is missing", async () => {
    vi.mocked(db.userInvoice.count).mockResolvedValue(0)
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue(null)

    const result = await ensureInvoicesForAssignment(
      SCHOOL_ID,
      FEE_ASSIGNMENT_ID
    )

    expect(result.invoicesCreated).toBe(0)
    expect(db.userInvoice.create).not.toHaveBeenCalled()
  })

  it("creates a single invoice when installments=1", async () => {
    vi.mocked(db.userInvoice.count).mockResolvedValue(0)
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      finalAmount: 1500,
      feeStructure: {
        name: "Tuition",
        installments: 1,
        paymentSchedule: null,
      },
      student: {
        userId: "u1",
        firstName: "Ada",
        middleName: null,
        lastName: "Lovelace",
        email: "ada@example.com",
      },
    } as never)
    setupSchool()
    setupAddresses()
    vi.mocked(db.userInvoice.create).mockResolvedValue({} as never)

    const result = await ensureInvoicesForAssignment(
      SCHOOL_ID,
      FEE_ASSIGNMENT_ID
    )

    expect(result.invoicesCreated).toBe(1)
    expect(db.userInvoice.create).toHaveBeenCalledTimes(1)
    expect(db.userInvoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          userId: "u1",
          feeAssignmentId: FEE_ASSIGNMENT_ID,
          total: 1500,
          sub_total: 1500,
          status: "UNPAID",
          currency: "USD",
        }),
      })
    )
  })

  it("creates one invoice per paymentSchedule entry when present", async () => {
    vi.mocked(db.userInvoice.count).mockResolvedValue(0)
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      finalAmount: 3000,
      feeStructure: {
        name: "Tuition",
        installments: 3,
        paymentSchedule: [
          {
            dueDate: "2026-01-01",
            amount: 1000,
            description: "Term 1",
          },
          {
            dueDate: "2026-04-01",
            amount: 1000,
            description: "Term 2",
          },
          {
            dueDate: "2026-07-01",
            amount: 1000,
            description: "Term 3",
          },
        ],
      },
      student: {
        userId: "u1",
        firstName: "Ada",
        middleName: null,
        lastName: "Lovelace",
        email: "ada@example.com",
      },
    } as never)
    setupSchool()
    setupAddresses()
    vi.mocked(db.userInvoice.create).mockResolvedValue({} as never)

    const result = await ensureInvoicesForAssignment(
      SCHOOL_ID,
      FEE_ASSIGNMENT_ID
    )

    expect(result.invoicesCreated).toBe(3)
    expect(db.userInvoice.create).toHaveBeenCalledTimes(3)
  })

  it("equally splits when installments > 1 and no paymentSchedule", async () => {
    vi.mocked(db.userInvoice.count).mockResolvedValue(0)
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      finalAmount: 1000,
      feeStructure: {
        name: "Tuition",
        installments: 3,
        paymentSchedule: null,
      },
      student: {
        userId: "u1",
        firstName: "Ada",
        middleName: null,
        lastName: "Lovelace",
        email: "ada@example.com",
      },
    } as never)
    setupSchool()
    setupAddresses()
    vi.mocked(db.userInvoice.create).mockResolvedValue({} as never)

    const result = await ensureInvoicesForAssignment(
      SCHOOL_ID,
      FEE_ASSIGNMENT_ID
    )

    expect(result.invoicesCreated).toBe(3)
    // First two installments are 333.33, last covers the remainder so the sum is exact
    const totals = vi
      .mocked(db.userInvoice.create)
      .mock.calls.map((c) => (c[0] as { data: { total: number } }).data.total)
    const sum = totals.reduce((acc, t) => acc + t, 0)
    expect(sum).toBeCloseTo(1000, 2)
  })

  it("scopes existence-check + assignment lookup by schoolId", async () => {
    vi.mocked(db.userInvoice.count).mockResolvedValue(0)
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue(null)

    await ensureInvoicesForAssignment(SCHOOL_ID, FEE_ASSIGNMENT_ID)

    expect(db.userInvoice.count).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_ID, feeAssignmentId: FEE_ASSIGNMENT_ID },
    })
    expect(db.feeAssignment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FEE_ASSIGNMENT_ID, schoolId: SCHOOL_ID },
      })
    )
  })
})
