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

import type {
  BalanceSheetData,
  IncomeStatementData,
  ReportActionResult,
  TrialBalanceData,
} from "./types"
import { reportRequestSchema } from "./validation"

export async function generateBalanceSheet(
  startDate: Date,
  endDate: Date,
  fiscalYearId?: string
): Promise<ReportActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    // Get account balances
    const balances = await db.accountBalance.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(fiscalYearId && { fiscalYearId }),
      },
      include: {
        account: {
          select: {
            code: true,
            name: true,
            type: true,
          },
        },
      },
    })

    // Categorize by account type
    const assets = balances.filter((b) => b.account.type === "ASSET")
    const liabilities = balances.filter((b) => b.account.type === "LIABILITY")
    const equity = balances.filter((b) => b.account.type === "EQUITY")

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0)
    const totalLiabilities = liabilities.reduce(
      (sum, l) => sum + Number(l.balance),
      0
    )
    const totalEquity = equity.reduce((sum, e) => sum + Number(e.balance), 0)

    const data: BalanceSheetData = {
      assets: assets.map((a) => ({
        accountCode: a.account.code,
        accountName: a.account.name,
        accountType: a.account.type,
        balance: Number(a.balance),
      })),
      liabilities: liabilities.map((l) => ({
        accountCode: l.account.code,
        accountName: l.account.name,
        accountType: l.account.type,
        balance: Number(l.balance),
      })),
      equity: equity.map((e) => ({
        accountCode: e.account.code,
        accountName: e.account.name,
        accountType: e.account.type,
        balance: Number(e.balance),
      })),
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
  endDate: Date,
  fiscalYearId?: string
): Promise<ReportActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    const balances = await db.accountBalance.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(fiscalYearId && { fiscalYearId }),
      },
      include: {
        account: {
          select: {
            code: true,
            name: true,
            type: true,
          },
        },
      },
    })

    const revenue = balances.filter((b) => b.account.type === "REVENUE")
    const expenses = balances.filter((b) => b.account.type === "EXPENSE")

    const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.balance), 0)
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.balance),
      0
    )

    const data: IncomeStatementData = {
      revenue: revenue.map((r) => ({
        accountCode: r.account.code,
        accountName: r.account.name,
        accountType: r.account.type,
        balance: Number(r.balance),
      })),
      expenses: expenses.map((e) => ({
        accountCode: e.account.code,
        accountName: e.account.name,
        accountType: e.account.type,
        balance: Number(e.balance),
      })),
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
  fiscalYearId?: string
): Promise<ReportActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    const balances = await db.accountBalance.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(fiscalYearId && { fiscalYearId }),
      },
      include: {
        account: {
          select: {
            code: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        account: {
          code: "asc",
        },
      },
    })

    const accounts = balances.map((b) => {
      const balance = Number(b.balance)
      return {
        accountCode: b.account.code,
        accountName: b.account.name,
        accountType: b.account.type,
        debitBalance: balance > 0 ? balance : 0,
        creditBalance: balance < 0 ? Math.abs(balance) : 0,
      }
    })

    const totalDebits = accounts.reduce((sum, a) => sum + a.debitBalance, 0)
    const totalCredits = accounts.reduce((sum, a) => sum + a.creditBalance, 0)

    const data: TrialBalanceData = {
      accounts,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      asOfDate: new Date(),
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
