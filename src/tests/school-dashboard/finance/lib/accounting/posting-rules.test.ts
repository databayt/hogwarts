// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import {
  createExpensePaymentEntry,
  createFeeAdjustmentEntry,
  createFeeAssignmentEntry,
  createFeePaymentEntry,
  createFinePaymentEntry,
  createInvoicePaymentEntry,
  createSalaryPaymentEntry,
  createWalletTopupEntry,
  StandardAccountCodes,
} from "@/components/school-dashboard/finance/lib/accounting/posting-rules"
import { validateDoubleEntry } from "@/components/school-dashboard/finance/lib/accounting/utils"

// The posting rules lazily backfill the chart of accounts by importing the real
// seed-accounts module (which writes via the real db). Stub it to a no-op so the
// "missing account" path re-resolves against the in-test mock db and surfaces the
// domain error ("Required accounts not found") rather than a Prisma FK error.
vi.mock(
  "@/components/school-dashboard/finance/lib/accounting/seed-accounts",
  () => ({
    initializeAccountingSystem: vi.fn(async () => ({ accountsCreated: 0 })),
  })
)

// ---------------------------------------------------------------------------
// A mock `db` that mirrors the real Prisma constraint: ChartOfAccount is keyed
// by `code` (@@unique([schoolId, code])). The mock ONLY matches on `where.code`.
//
// This is deliberate: the production bug passed `accountCode` to the where-clause,
// which Prisma rejected (swallowed as "Required accounts not found"), so NO ledger
// entry was ever written. If that regression returns, `where.code` is undefined here,
// findFirst returns null, and the posting rule throws — failing these tests loudly.
// ---------------------------------------------------------------------------
function makeDb(knownCodes: string[]) {
  const whereCalls: Array<Record<string, unknown>> = []
  const db = {
    whereCalls,
    chartOfAccount: {
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          whereCalls.push(where)
          const code = where.code as string | undefined
          if (code && knownCodes.includes(code)) {
            return { id: `acct-${code}`, type: "ASSET" }
          }
          return null
        }
      ),
    },
  }
  return db
}

const SCHOOL_ID = "school-1"
const ALL_CODES = Object.values(StandardAccountCodes)

describe("accounting/posting-rules — chart-of-account lookup field name", () => {
  it("queries ChartOfAccount by `code`, never the non-existent `accountCode` field", async () => {
    const db = makeDb(ALL_CODES)

    await createFeePaymentEntry(
      SCHOOL_ID,
      {
        paymentId: "pay-1",
        studentId: "stu-1",
        amount: 5000,
        paymentMethod: "CASH",
        paymentDate: new Date("2026-01-01"),
      },
      db as never
    )

    // Every lookup must use { schoolId, code } — proving the field-name fix.
    expect(db.whereCalls.length).toBeGreaterThan(0)
    for (const where of db.whereCalls) {
      expect(where).toHaveProperty("code")
      expect(where).not.toHaveProperty("accountCode")
      expect(where.schoolId).toBe(SCHOOL_ID)
    }
  })

  it("throws when a required account is missing (account not in chart)", async () => {
    const db = makeDb([]) // no accounts seeded
    await expect(
      createFeePaymentEntry(
        SCHOOL_ID,
        {
          paymentId: "pay-1",
          studentId: "stu-1",
          amount: 100,
          paymentMethod: "CASH",
          paymentDate: new Date(),
        },
        db as never
      )
    ).rejects.toThrow(/Required accounts not found/)
  })
})

describe("accounting/posting-rules — whole-unit amounts (no cents inflation)", () => {
  it("fee payment stores the raw amount, not amount*100", async () => {
    const db = makeDb(ALL_CODES)
    const entry = await createFeePaymentEntry(
      SCHOOL_ID,
      {
        paymentId: "pay-1",
        studentId: "stu-1",
        amount: 5000,
        paymentMethod: "CASH",
        paymentDate: new Date(),
      },
      db as never
    )

    const cashLine = entry.lines.find(
      (l) => l.accountCode === StandardAccountCodes.CASH
    )
    expect(cashLine?.debit).toBe(5000) // would be 500000 if toCents() regressed
    expect(validateDoubleEntry(entry.lines)).toBe(true)
  })

  it("fee assignment, invoice, expense, wallet top-up all balance with whole units", async () => {
    const db = makeDb(ALL_CODES)

    const assignment = await createFeeAssignmentEntry(
      SCHOOL_ID,
      {
        assignmentId: "asg-1",
        studentId: "stu-1",
        amount: 1234.56,
        feeType: "TUITION",
        assignedDate: new Date(),
      },
      db as never
    )
    expect(
      assignment.lines.every((l) => l.debit <= 1234.56 && l.credit <= 1234.56)
    ).toBe(true)
    expect(validateDoubleEntry(assignment.lines)).toBe(true)

    const invoice = await createInvoicePaymentEntry(
      SCHOOL_ID,
      {
        invoiceId: "inv-1",
        amount: 800,
        paymentDate: new Date(),
        invoiceNumber: "INV-001",
      },
      db as never
    )
    expect(invoice.lines[0]?.debit).toBe(800)
    expect(validateDoubleEntry(invoice.lines)).toBe(true)

    const expense = await createExpensePaymentEntry(
      SCHOOL_ID,
      {
        expenseId: "exp-1",
        categoryName: "Utilities",
        amount: 250,
        paymentDate: new Date(),
        description: "Electricity",
      },
      db as never
    )
    expect(expense.lines[0]?.debit).toBe(250)
    expect(validateDoubleEntry(expense.lines)).toBe(true)

    const topup = await createWalletTopupEntry(
      SCHOOL_ID,
      { transactionId: "txn-1", amount: 300, topupDate: new Date() },
      db as never
    )
    expect(topup.lines[0]?.debit).toBe(300)
    expect(validateDoubleEntry(topup.lines)).toBe(true)
  })

  it("salary payment records the gross expense in whole units (no withholdings case)", async () => {
    const db = makeDb(ALL_CODES)
    const entry = await createSalaryPaymentEntry(
      SCHOOL_ID,
      {
        slipId: "slip-1",
        teacherId: "tch-1",
        grossSalary: 10000,
        taxAmount: 0,
        socialSecurityAmount: 0,
        netSalary: 10000,
        paymentDate: new Date(),
      },
      db as never
    )

    const salaryLine = entry.lines.find(
      (l) => l.accountCode === StandardAccountCodes.SALARY_EXPENSE
    )
    expect(salaryLine?.debit).toBe(10000) // whole units, not 1,000,000
    expect(validateDoubleEntry(entry.lines)).toBe(true)
  })

  it("salary payment BALANCES with tax + other deductions (withholding model)", async () => {
    const db = makeDb(ALL_CODES)
    // gross 10,000; tax 1,500 withheld; 500 other deductions (insurance/loan) →
    // net = 10,000 − 1,500 − 500 = 8,000. socialSecurity 0.
    const entry = await createSalaryPaymentEntry(
      SCHOOL_ID,
      {
        slipId: "slip-2",
        teacherId: "tch-1",
        grossSalary: 10000,
        taxAmount: 1500,
        socialSecurityAmount: 0,
        netSalary: 8000,
        paymentDate: new Date(),
      },
      db as never
    )

    // No standalone payroll-tax-expense debit (the old unbalanced bug).
    expect(
      entry.lines.some(
        (l) => l.accountCode === StandardAccountCodes.PAYROLL_TAX_EXPENSE
      )
    ).toBe(false)
    // Residual (10,000 − 8,000 − 1,500 = 500) credited to Accounts Payable.
    const apLine = entry.lines.find(
      (l) => l.accountCode === StandardAccountCodes.ACCOUNTS_PAYABLE
    )
    expect(apLine?.credit).toBe(500)
    expect(validateDoubleEntry(entry.lines)).toBe(true)
  })
})

describe("accounting/posting-rules — fine payment (reachable UI, was never posted)", () => {
  it("balances DR Cash / CR Other Revenue and keys idempotency on fine:<id>", async () => {
    const db = makeDb(ALL_CODES)

    const entry = await createFinePaymentEntry(
      SCHOOL_ID,
      {
        fineId: "fine-1",
        amount: 250,
        paymentDate: new Date("2026-07-01"),
      },
      db as never
    )

    const cashLine = entry.lines.find(
      (l) => l.accountCode === StandardAccountCodes.CASH
    )
    const revenueLine = entry.lines.find(
      (l) => l.accountCode === StandardAccountCodes.OTHER_REVENUE
    )
    expect(cashLine?.debit).toBe(250)
    expect(revenueLine?.credit).toBe(250)
    expect(entry.sourceRecordId).toBe("fine:fine-1")
    expect(validateDoubleEntry(entry.lines)).toBe(true)
  })
})

describe("accounting/posting-rules — fee adjustment (scholarship/discount drift fix)", () => {
  it("relieves the overstated receivable: DR Fees Revenue / CR Fees Receivable", async () => {
    const db = makeDb(ALL_CODES)

    const entry = await createFeeAdjustmentEntry(
      SCHOOL_ID,
      {
        assignmentId: "fa-1",
        adjustmentRef: "feeadj:scholarship:sch-1:fa-1",
        amount: 1200,
        adjustedDate: new Date("2026-07-01"),
        reason: "Scholarship applied",
      },
      db as never
    )

    const revenueLine = entry.lines.find(
      (l) => l.accountCode === StandardAccountCodes.STUDENT_FEES_REVENUE
    )
    const receivableLine = entry.lines.find(
      (l) => l.accountCode === StandardAccountCodes.STUDENT_FEES_RECEIVABLE
    )
    expect(revenueLine?.debit).toBe(1200)
    expect(receivableLine?.credit).toBe(1200)
    // Replay protection rides on the caller-supplied unique ref.
    expect(entry.sourceRecordId).toBe("feeadj:scholarship:sch-1:fa-1")
    expect(validateDoubleEntry(entry.lines)).toBe(true)
  })
})
