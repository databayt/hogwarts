// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Reports Module - Server Actions
 */

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { AccountType } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { checkFinancePermission } from "../lib/permissions"
import type {
  AccountSummary,
  BalanceSheetData,
  IncomeStatementData,
  ReportActionResult,
  TrialBalanceData,
} from "./types"
import { reportRequestSchema } from "./validation"

/**
 * Per-account net movement, read from the POSTED ledger — the source of truth.
 *
 * We deliberately read `LedgerEntry` (written in the same transaction as its
 * `JournalEntry`, so it can never drift) rather than the `AccountBalance` cache,
 * which is a per-posting-DATE delta row, is written by only one of the two
 * posting paths, and has no fiscal-year column. Volume is a few hundred rows per
 * school, so a findMany + in-memory rollup is both correct and cheap.
 *
 * `range.from` (inclusive) bounds period reports (P&L); omit it for as-of
 * reports (balance sheet, trial balance) which are cumulative up to `range.to`.
 */
interface LedgerAccount {
  accountId: string
  code: string
  name: string
  type: AccountType
  debit: number
  credit: number
}

async function getLedgerAccountActivity(
  schoolId: string,
  range: { from?: Date; to: Date }
): Promise<LedgerAccount[]> {
  const lines = await db.ledgerEntry.findMany({
    where: {
      schoolId,
      journalEntry: {
        schoolId,
        isPosted: true,
        isReversed: false,
        entryDate: { ...(range.from && { gte: range.from }), lte: range.to },
      },
    },
    select: {
      debit: true,
      credit: true,
      accountId: true,
      account: { select: { code: true, name: true, type: true } },
    },
  })

  const byAccount = new Map<string, LedgerAccount>()
  for (const line of lines) {
    let acc = byAccount.get(line.accountId)
    if (!acc) {
      acc = {
        accountId: line.accountId,
        code: line.account.code,
        name: line.account.name,
        type: line.account.type,
        debit: 0,
        credit: 0,
      }
      byAccount.set(line.accountId, acc)
    }
    acc.debit += Number(line.debit)
    acc.credit += Number(line.credit)
  }

  return [...byAccount.values()].sort((a, b) => a.code.localeCompare(b.code))
}

/** Debit-normal for ASSET/EXPENSE, credit-normal for LIABILITY/EQUITY/REVENUE. */
function normalBalance(acc: LedgerAccount): number {
  const debitNormal = acc.type === "ASSET" || acc.type === "EXPENSE"
  return debitNormal ? acc.debit - acc.credit : acc.credit - acc.debit
}

function toSummary(acc: LedgerAccount): AccountSummary {
  return {
    accountCode: acc.code,
    accountName: acc.name,
    accountType: acc.type,
    balance: normalBalance(acc),
  }
}

export async function generateBalanceSheet(
  startDate: Date,
  endDate: Date
): Promise<ReportActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    if (
      !(await checkFinancePermission(
        session.user.id!,
        session.user.schoolId,
        "reports",
        "view"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // As-of statement: cumulative up to endDate (startDate is unused here — a
    // balance sheet carries forward all prior activity, not just the period's).
    const activity = await getLedgerAccountActivity(session.user.schoolId, {
      to: endDate,
    })

    const assets = activity.filter((a) => a.type === "ASSET").map(toSummary)
    const liabilities = activity
      .filter((a) => a.type === "LIABILITY")
      .map(toSummary)
    const equityAccounts = activity
      .filter((a) => a.type === "EQUITY")
      .map(toSummary)

    // Revenue − Expense for the period is retained earnings that no closing
    // entry has swept into an equity account yet. Surfacing it as a derived
    // equity line is what makes Assets ≡ Liabilities + Equity hold: every
    // posted journal entry balances, so summing (debit − credit) across ALL
    // accounts is zero, and this line captures the revenue/expense remainder.
    const totalRevenue = activity
      .filter((a) => a.type === "REVENUE")
      .reduce((sum, a) => sum + normalBalance(a), 0)
    const totalExpenses = activity
      .filter((a) => a.type === "EXPENSE")
      .reduce((sum, a) => sum + normalBalance(a), 0)
    const currentYearEarnings = totalRevenue - totalExpenses

    const equity: AccountSummary[] = [...equityAccounts]
    if (currentYearEarnings !== 0) {
      equity.push({
        accountCode: "3100",
        accountName: "Current Year Earnings",
        accountType: "EQUITY",
        balance: currentYearEarnings,
        isComputed: true,
      })
    }

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0)
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0)
    const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0)

    const data: BalanceSheetData = {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      asOfDate: endDate,
      isBalanced:
        Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error generating balance sheet:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "UNKNOWN",
    }
  }
}

export async function generateIncomeStatement(
  startDate: Date,
  endDate: Date
): Promise<ReportActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    if (
      !(await checkFinancePermission(
        session.user.id!,
        session.user.schoolId,
        "reports",
        "view"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Period statement: only entries within [startDate, endDate].
    const activity = await getLedgerAccountActivity(session.user.schoolId, {
      from: startDate,
      to: endDate,
    })

    const revenue = activity.filter((a) => a.type === "REVENUE").map(toSummary)
    const expenses = activity.filter((a) => a.type === "EXPENSE").map(toSummary)

    const totalRevenue = revenue.reduce((sum, r) => sum + r.balance, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.balance, 0)

    const data: IncomeStatementData = {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      startDate,
      endDate,
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error generating income statement:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "UNKNOWN",
    }
  }
}

export async function generateTrialBalance(
  startDate: Date,
  endDate: Date
): Promise<ReportActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    if (
      !(await checkFinancePermission(
        session.user.id!,
        session.user.schoolId,
        "reports",
        "view"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // As-of: every posted line up to endDate, one row per account.
    const activity = await getLedgerAccountActivity(session.user.schoolId, {
      to: endDate,
    })

    const accounts = activity.map((acc) => {
      const balance = normalBalance(acc)
      const debitNormal = acc.type === "ASSET" || acc.type === "EXPENSE"
      // A trial balance lists each account on its normal side; a negative
      // normal balance (contra) flips to the other column.
      return {
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        debitBalance: debitNormal
          ? Math.max(balance, 0)
          : Math.max(-balance, 0),
        creditBalance: debitNormal
          ? Math.max(-balance, 0)
          : Math.max(balance, 0),
      }
    })

    const totalDebits = accounts.reduce((sum, a) => sum + a.debitBalance, 0)
    const totalCredits = accounts.reduce((sum, a) => sum + a.creditBalance, 0)

    const data: TrialBalanceData = {
      accounts,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      asOfDate: endDate,
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error generating trial balance:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "UNKNOWN",
    }
  }
}

export async function getAvailableReports() {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    if (
      !(await checkFinancePermission(
        session.user.id!,
        session.user.schoolId,
        "reports",
        "view"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Return list of available reports (labels resolved via dictionary on client)
    const reports = [
      {
        id: "BALANCE_SHEET",
        nameKey: "balanceSheet",
        descriptionKey: "balanceSheetDesc",
        category: "FINANCIAL_STATEMENTS",
      },
      {
        id: "INCOME_STATEMENT",
        nameKey: "incomeStatement",
        descriptionKey: "incomeStatementDesc",
        category: "FINANCIAL_STATEMENTS",
      },
      {
        id: "CASH_FLOW",
        nameKey: "cashFlow",
        descriptionKey: "cashFlowDesc",
        category: "FINANCIAL_STATEMENTS",
      },
      {
        id: "TRIAL_BALANCE",
        nameKey: "trialBalance",
        descriptionKey: "trialBalanceDesc",
        category: "ACCOUNTING",
      },
    ]

    return { success: true, data: reports }
  } catch (error) {
    console.error("Error fetching available reports:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}
