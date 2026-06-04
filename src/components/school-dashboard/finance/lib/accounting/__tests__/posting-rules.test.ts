// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createFeePaymentEntry,
  StandardAccountCodes,
} from "../posting-rules"

// Mock the lazy-seed import so the backfill branch is observable + inert.
const initializeAccountingSystem = vi.fn().mockResolvedValue({})
vi.mock("../seed-accounts", () => ({
  initializeAccountingSystem: (...args: unknown[]) =>
    initializeAccountingSystem(...args),
}))

const SCHOOL_ID = "school-1"

/** A db stub whose chartOfAccount.findFirst resolves accounts by `code`. */
function dbWithAccounts(codes: string[]) {
  return {
    chartOfAccount: {
      findFirst: vi.fn(
        async ({ where }: { where: { schoolId: string; code: string } }) =>
          codes.includes(where.code) ? { id: `acc-${where.code}` } : null
      ),
    },
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createFeePaymentEntry", () => {
  const payment = {
    paymentId: "pay-1",
    studentId: "stud-1",
    amount: 5000,
    paymentMethod: "CASH",
    paymentDate: new Date("2026-09-01"),
  }

  it("resolves accounts by `code` (not the non-existent `accountCode`)", async () => {
    const db = dbWithAccounts([
      StandardAccountCodes.CASH,
      StandardAccountCodes.STUDENT_FEES_RECEIVABLE,
      StandardAccountCodes.STUDENT_FEES_REVENUE,
    ])

    await createFeePaymentEntry(SCHOOL_ID, payment, db)

    const findFirst = (db as unknown as {
      chartOfAccount: { findFirst: ReturnType<typeof vi.fn> }
    }).chartOfAccount.findFirst
    // The regression guard: the WHERE clause must key on `code`, scoped by school.
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: SCHOOL_ID, code: StandardAccountCodes.CASH },
        select: { id: true },
      })
    )
  })

  it("produces a balanced entry (sum of debits == sum of credits)", async () => {
    const db = dbWithAccounts([
      StandardAccountCodes.CASH,
      StandardAccountCodes.STUDENT_FEES_RECEIVABLE,
      StandardAccountCodes.STUDENT_FEES_REVENUE,
    ])

    const entry = await createFeePaymentEntry(SCHOOL_ID, payment, db)

    const debits = entry.lines.reduce((s, l) => s + l.debit, 0)
    const credits = entry.lines.reduce((s, l) => s + l.credit, 0)
    expect(debits).toBe(credits)
    expect(debits).toBeGreaterThan(0)
    expect(entry.autoPost).toBe(true)
  })

  it("lazily seeds the chart of accounts when accounts are missing, then re-resolves", async () => {
    // First three lookups (cash/recv/rev) miss; after seeding they resolve.
    let seeded = false
    const findFirst = vi.fn(
      async ({ where }: { where: { schoolId: string; code: string } }) => {
        if (!seeded) return null
        return { id: `acc-${where.code}` }
      }
    )
    initializeAccountingSystem.mockImplementation(async () => {
      seeded = true
      return {}
    })
    const db = { chartOfAccount: { findFirst } } as never

    const entry = await createFeePaymentEntry(SCHOOL_ID, payment, db)

    expect(initializeAccountingSystem).toHaveBeenCalledWith(SCHOOL_ID)
    expect(entry.lines.length).toBeGreaterThan(0)
  })

  it("throws when accounts are still missing after a seed attempt", async () => {
    const db = dbWithAccounts([]) // never resolves any account
    await expect(
      createFeePaymentEntry(SCHOOL_ID, payment, db)
    ).rejects.toThrow(/Required accounts not found/)
    // It tried to self-heal before giving up.
    expect(initializeAccountingSystem).toHaveBeenCalledTimes(1)
  })
})
