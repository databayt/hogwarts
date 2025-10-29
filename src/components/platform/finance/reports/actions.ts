/**
 * Reports Module - Server Actions
 */

'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { reportRequestSchema } from './validation'
import type { ReportActionResult, BalanceSheetData, IncomeStatementData, TrialBalanceData } from './types'
import { AccountType } from '@prisma/client'

export async function generateBalanceSheet(
  startDate: Date,
  endDate: Date,
  fiscalYearId?: string
): Promise<ReportActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
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
    const assets = balances.filter(b => b.account.type === 'ASSET')
    const liabilities = balances.filter(b => b.account.type === 'LIABILITY')
    const equity = balances.filter(b => b.account.type === 'EQUITY')

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0)
    const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.balance), 0)
    const totalEquity = equity.reduce((sum, e) => sum + Number(e.balance), 0)

    const data: BalanceSheetData = {
      assets: assets.map(a => ({
        accountCode: a.account.code,
        accountName: a.account.name,
        accountType: a.account.type,
        balance: Number(a.balance),
      })),
      liabilities: liabilities.map(l => ({
        accountCode: l.account.code,
        accountName: l.account.name,
        accountType: l.account.type,
        balance: Number(l.balance),
      })),
      equity: equity.map(e => ({
        accountCode: e.account.code,
        accountName: e.account.name,
        accountType: e.account.type,
        balance: Number(e.balance),
      })),
      totalAssets,
      totalLiabilities,
      totalEquity,
      asOfDate: endDate,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error generating balance sheet:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate balance sheet' }
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
      return { success: false, error: 'Unauthorized' }
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

    const revenue = balances.filter(b => b.account.type === 'REVENUE')
    const expenses = balances.filter(b => b.account.type === 'EXPENSE')

    const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.balance), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.balance), 0)

    const data: IncomeStatementData = {
      revenue: revenue.map(r => ({
        accountCode: r.account.code,
        accountName: r.account.name,
        accountType: r.account.type,
        balance: Number(r.balance),
      })),
      expenses: expenses.map(e => ({
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
    console.error('Error generating income statement:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate income statement' }
  }
}

export async function generateTrialBalance(fiscalYearId?: string): Promise<ReportActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
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
          code: 'asc',
        },
      },
    })

    const accounts = balances.map(b => {
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
    console.error('Error generating trial balance:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate trial balance' }
  }
}

export async function getAvailableReports() {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Return list of available reports
    const reports = [
      {
        id: 'BALANCE_SHEET',
        name: 'Balance Sheet',
        description: 'Assets, liabilities, and equity',
        category: 'FINANCIAL_STATEMENTS',
      },
      {
        id: 'INCOME_STATEMENT',
        name: 'Income Statement',
        description: 'Revenue and expenses',
        category: 'FINANCIAL_STATEMENTS',
      },
      {
        id: 'CASH_FLOW',
        name: 'Cash Flow Statement',
        description: 'Cash inflows and outflows',
        category: 'FINANCIAL_STATEMENTS',
      },
      {
        id: 'TRIAL_BALANCE',
        name: 'Trial Balance',
        description: 'Account balances verification',
        category: 'ACCOUNTING',
      },
    ]

    return { success: true, data: reports }
  } catch (error) {
    console.error('Error fetching available reports:', error)
    return { success: false, error: 'Failed to fetch reports' }
  }
}
