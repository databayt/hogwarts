// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Property test: every posting rule emits a BALANCED journal entry for any
 * amounts, so a new rule (or an edit to an existing one) can't ship an
 * unbalanced entry without a human remembering to hand-write its balance case.
 *
 * This is the mechanical net for the class of bug that shipped twice before:
 * the salary rule once posted an unbalanced entry (771166fc7), and a negative
 * net salary once inverted the Cash credit (the clamp at posting-rules.ts:324).
 * Fuzzing rather than example-based testing is deliberate — the failure modes
 * live in the odd combinations (net > gross, net < 0, zero everything).
 */

import fc from "fast-check"
import { describe, expect, it, vi } from "vitest"

import {
  createExpensePaymentEntry,
  createFeeAssignmentEntry,
  createFeePaymentEntry,
  createInvoicePaymentEntry,
  createSalaryPaymentEntry,
  createWalletTopupEntry,
  StandardAccountCodes,
} from "@/components/school-dashboard/finance/lib/accounting/posting-rules"
import { validateDoubleEntry } from "@/components/school-dashboard/finance/lib/accounting/utils"

vi.mock(
  "@/components/school-dashboard/finance/lib/accounting/seed-accounts",
  () => ({
    initializeAccountingSystem: vi.fn(async () => ({ accountsCreated: 0 })),
  })
)

const SCHOOL_ID = "school-1"
const ALL_CODES = Object.values(StandardAccountCodes)

// Mock db whose ChartOfAccount lookup resolves every standard code (keyed on
// `code`, mirroring @@unique([schoolId, code])).
function makeDb() {
  return {
    chartOfAccount: {
      findFirst: vi.fn(async ({ where }: { where: { code?: string } }) =>
        where.code && ALL_CODES.includes(where.code)
          ? { id: `acct-${where.code}`, type: "ASSET" }
          : null
      ),
    },
  } as never
}

/** Whole-unit money in cent steps: 0.00 .. 1,000,000.00. */
const money = fc
  .integer({ min: 0, max: 100_000_000 })
  .map((cents) => cents / 100)

const RUNS = 500

describe("accounting/posting-rules — every entry balances (property)", () => {
  it("salary payment balances for any gross/tax/ss/net (incl. negative net)", async () => {
    await fc.assert(
      fc.asyncProperty(
        money,
        money,
        money,
        money,
        async (grossSalary, taxAmount, socialSecurityAmount, netSalary) => {
          const entry = await createSalaryPaymentEntry(
            SCHOOL_ID,
            {
              slipId: "slip-1",
              teacherId: "t-1",
              grossSalary,
              taxAmount,
              socialSecurityAmount,
              netSalary,
              paymentDate: new Date("2026-01-01"),
            },
            makeDb()
          )
          expect(validateDoubleEntry(entry.lines)).toBe(true)
          // No line may carry a negative debit or credit — a negative amount
          // silently flips a debit into a credit and corrupts the balance.
          for (const line of entry.lines) {
            expect(line.debit).toBeGreaterThanOrEqual(0)
            expect(line.credit).toBeGreaterThanOrEqual(0)
          }
        }
      ),
      { numRuns: RUNS }
    )
  })

  it("fee payment balances for any amount", async () => {
    await fc.assert(
      fc.asyncProperty(money, async (amount) => {
        const entry = await createFeePaymentEntry(
          SCHOOL_ID,
          {
            paymentId: "p-1",
            studentId: "s-1",
            amount,
            paymentMethod: "CASH",
            paymentDate: new Date("2026-01-01"),
          },
          makeDb()
        )
        expect(validateDoubleEntry(entry.lines)).toBe(true)
      }),
      { numRuns: RUNS }
    )
  })

  it("fee assignment balances for any amount", async () => {
    await fc.assert(
      fc.asyncProperty(money, async (amount) => {
        const entry = await createFeeAssignmentEntry(
          SCHOOL_ID,
          {
            assignmentId: "a-1",
            studentId: "s-1",
            amount,
            feeType: "TUITION",
            assignedDate: new Date("2026-01-01"),
          },
          makeDb()
        )
        expect(validateDoubleEntry(entry.lines)).toBe(true)
        for (const line of entry.lines) {
          expect(line.debit).toBeGreaterThanOrEqual(0)
          expect(line.credit).toBeGreaterThanOrEqual(0)
        }
      }),
      { numRuns: RUNS }
    )
  })

  it("expense payment balances for any amount", async () => {
    await fc.assert(
      fc.asyncProperty(money, async (amount) => {
        const entry = await createExpensePaymentEntry(
          SCHOOL_ID,
          {
            expenseId: "e-1",
            categoryName: "Utilities",
            amount,
            paymentDate: new Date("2026-01-01"),
            description: "test",
          },
          makeDb()
        )
        expect(validateDoubleEntry(entry.lines)).toBe(true)
      }),
      { numRuns: RUNS }
    )
  })

  it("invoice payment balances for any amount", async () => {
    await fc.assert(
      fc.asyncProperty(money, async (amount) => {
        const entry = await createInvoicePaymentEntry(
          SCHOOL_ID,
          {
            invoiceId: "i-1",
            amount,
            paymentDate: new Date("2026-01-01"),
            invoiceNumber: "INV-1",
          },
          makeDb()
        )
        expect(validateDoubleEntry(entry.lines)).toBe(true)
      }),
      { numRuns: RUNS }
    )
  })

  it("wallet top-up balances for any amount", async () => {
    await fc.assert(
      fc.asyncProperty(money, async (amount) => {
        const entry = await createWalletTopupEntry(
          SCHOOL_ID,
          {
            transactionId: "w-1",
            amount,
            topupDate: new Date("2026-01-01"),
          },
          makeDb()
        )
        expect(validateDoubleEntry(entry.lines)).toBe(true)
      }),
      { numRuns: RUNS }
    )
  })
})
