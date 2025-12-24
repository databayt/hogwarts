/**
 * Finance Seed
 * Creates Chart of Accounts, Journal Entries
 *
 * Phase 9: Finance
 *
 * Note: ChartOfAccount model uses:
 * - @@unique([schoolId, code])
 * - Field names: code, name, type (not accountCode, accountName, accountType)
 * - Required field: normalBalance (DEBIT/CREDIT)
 * - Parent reference: parentId (not parentAccountId)
 */

import type { PrismaClient } from "@prisma/client"

import { logPhase, logSuccess } from "./utils"

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================

// Helper to determine normal balance based on account type
function getNormalBalance(type: string): "DEBIT" | "CREDIT" {
  // Assets and Expenses have normal DEBIT balance
  // Liabilities, Equity, and Revenue have normal CREDIT balance
  if (type === "ASSET" || type === "EXPENSE") {
    return "DEBIT"
  }
  return "CREDIT"
}

const CHART_OF_ACCOUNTS = [
  // Assets (1xxx)
  {
    code: "1000",
    name: "Assets",
    type: "ASSET",
    isParent: true,
  },
  {
    code: "1100",
    name: "Cash and Cash Equivalents",
    type: "ASSET",
    parentCode: "1000",
  },
  {
    code: "1110",
    name: "Petty Cash",
    type: "ASSET",
    parentCode: "1100",
  },
  {
    code: "1120",
    name: "Bank Account - Operating",
    type: "ASSET",
    parentCode: "1100",
  },
  {
    code: "1130",
    name: "Bank Account - Savings",
    type: "ASSET",
    parentCode: "1100",
  },
  {
    code: "1200",
    name: "Accounts Receivable",
    type: "ASSET",
    parentCode: "1000",
  },
  {
    code: "1210",
    name: "Tuition Receivable",
    type: "ASSET",
    parentCode: "1200",
  },
  {
    code: "1220",
    name: "Other Receivables",
    type: "ASSET",
    parentCode: "1200",
  },
  {
    code: "1300",
    name: "Fixed Assets",
    type: "ASSET",
    parentCode: "1000",
  },
  {
    code: "1310",
    name: "Buildings",
    type: "ASSET",
    parentCode: "1300",
  },
  {
    code: "1320",
    name: "Equipment",
    type: "ASSET",
    parentCode: "1300",
  },
  {
    code: "1330",
    name: "Vehicles",
    type: "ASSET",
    parentCode: "1300",
  },

  // Liabilities (2xxx)
  {
    code: "2000",
    name: "Liabilities",
    type: "LIABILITY",
    isParent: true,
  },
  {
    code: "2100",
    name: "Accounts Payable",
    type: "LIABILITY",
    parentCode: "2000",
  },
  {
    code: "2110",
    name: "Supplier Payables",
    type: "LIABILITY",
    parentCode: "2100",
  },
  {
    code: "2200",
    name: "Accrued Expenses",
    type: "LIABILITY",
    parentCode: "2000",
  },
  {
    code: "2210",
    name: "Salaries Payable",
    type: "LIABILITY",
    parentCode: "2200",
  },
  {
    code: "2300",
    name: "Deferred Revenue",
    type: "LIABILITY",
    parentCode: "2000",
  },
  {
    code: "2310",
    name: "Advance Tuition",
    type: "LIABILITY",
    parentCode: "2300",
  },

  // Equity (3xxx)
  {
    code: "3000",
    name: "Equity",
    type: "EQUITY",
    isParent: true,
  },
  {
    code: "3100",
    name: "Capital",
    type: "EQUITY",
    parentCode: "3000",
  },
  {
    code: "3200",
    name: "Retained Earnings",
    type: "EQUITY",
    parentCode: "3000",
  },

  // Revenue (4xxx)
  {
    code: "4000",
    name: "Revenue",
    type: "REVENUE",
    isParent: true,
  },
  {
    code: "4100",
    name: "Tuition Revenue",
    type: "REVENUE",
    parentCode: "4000",
  },
  {
    code: "4110",
    name: "Kindergarten Tuition",
    type: "REVENUE",
    parentCode: "4100",
  },
  {
    code: "4120",
    name: "Primary Tuition",
    type: "REVENUE",
    parentCode: "4100",
  },
  {
    code: "4130",
    name: "Intermediate Tuition",
    type: "REVENUE",
    parentCode: "4100",
  },
  {
    code: "4140",
    name: "Secondary Tuition",
    type: "REVENUE",
    parentCode: "4100",
  },
  {
    code: "4200",
    name: "Other Revenue",
    type: "REVENUE",
    parentCode: "4000",
  },
  {
    code: "4210",
    name: "Registration Fees",
    type: "REVENUE",
    parentCode: "4200",
  },
  {
    code: "4220",
    name: "Library Fees",
    type: "REVENUE",
    parentCode: "4200",
  },
  {
    code: "4230",
    name: "Lab Fees",
    type: "REVENUE",
    parentCode: "4200",
  },
  {
    code: "4240",
    name: "Transport Fees",
    type: "REVENUE",
    parentCode: "4200",
  },

  // Expenses (5xxx)
  {
    code: "5000",
    name: "Expenses",
    type: "EXPENSE",
    isParent: true,
  },
  {
    code: "5100",
    name: "Personnel Expenses",
    type: "EXPENSE",
    parentCode: "5000",
  },
  {
    code: "5110",
    name: "Teacher Salaries",
    type: "EXPENSE",
    parentCode: "5100",
  },
  {
    code: "5120",
    name: "Staff Salaries",
    type: "EXPENSE",
    parentCode: "5100",
  },
  {
    code: "5130",
    name: "Benefits",
    type: "EXPENSE",
    parentCode: "5100",
  },
  {
    code: "5200",
    name: "Operating Expenses",
    type: "EXPENSE",
    parentCode: "5000",
  },
  {
    code: "5210",
    name: "Utilities",
    type: "EXPENSE",
    parentCode: "5200",
  },
  {
    code: "5220",
    name: "Maintenance",
    type: "EXPENSE",
    parentCode: "5200",
  },
  {
    code: "5230",
    name: "Supplies",
    type: "EXPENSE",
    parentCode: "5200",
  },
  {
    code: "5240",
    name: "Insurance",
    type: "EXPENSE",
    parentCode: "5200",
  },
  {
    code: "5300",
    name: "Educational Expenses",
    type: "EXPENSE",
    parentCode: "5000",
  },
  {
    code: "5310",
    name: "Books and Materials",
    type: "EXPENSE",
    parentCode: "5300",
  },
  {
    code: "5320",
    name: "Technology",
    type: "EXPENSE",
    parentCode: "5300",
  },
  {
    code: "5330",
    name: "Activities",
    type: "EXPENSE",
    parentCode: "5300",
  },
]

// ============================================================================
// FINANCE SEEDING
// ============================================================================

/**
 * Seed chart of accounts
 * Note: ChartOfAccount model (singular) uses @@unique([schoolId, code])
 */
export async function seedFinance(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  logPhase(9, "FINANCE", "المالية")

  let accountCount = 0
  const accountMap = new Map<string, string>()

  // First pass: create parent accounts
  for (const account of CHART_OF_ACCOUNTS.filter((a) => a.isParent)) {
    try {
      const created = await prisma.chartOfAccount.upsert({
        where: {
          schoolId_code: {
            schoolId,
            code: account.code,
          },
        },
        update: {
          name: account.name,
          type: account.type as
            | "ASSET"
            | "LIABILITY"
            | "EQUITY"
            | "REVENUE"
            | "EXPENSE",
        },
        create: {
          schoolId,
          code: account.code,
          name: account.name,
          type: account.type as
            | "ASSET"
            | "LIABILITY"
            | "EQUITY"
            | "REVENUE"
            | "EXPENSE",
          normalBalance: getNormalBalance(account.type),
          isActive: true,
        },
      })
      accountMap.set(account.code, created.id)
      accountCount++
    } catch {
      // Skip if account already exists
    }
  }

  // Second pass: create child accounts
  for (const account of CHART_OF_ACCOUNTS.filter((a) => !a.isParent)) {
    try {
      const parentId = account.parentCode
        ? accountMap.get(account.parentCode)
        : null

      const created = await prisma.chartOfAccount.upsert({
        where: {
          schoolId_code: {
            schoolId,
            code: account.code,
          },
        },
        update: {
          name: account.name,
          type: account.type as
            | "ASSET"
            | "LIABILITY"
            | "EQUITY"
            | "REVENUE"
            | "EXPENSE",
          parentId,
        },
        create: {
          schoolId,
          code: account.code,
          name: account.name,
          type: account.type as
            | "ASSET"
            | "LIABILITY"
            | "EQUITY"
            | "REVENUE"
            | "EXPENSE",
          normalBalance: getNormalBalance(account.type),
          parentId,
          isActive: true,
        },
      })
      accountMap.set(account.code, created.id)
      accountCount++
    } catch {
      // Skip if account already exists
    }
  }

  logSuccess(
    "Chart of Accounts",
    accountCount,
    "Assets, Liabilities, Revenue, Expenses"
  )

  return accountCount
}
