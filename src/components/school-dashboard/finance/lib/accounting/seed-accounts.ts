/**
 * Chart of Accounts Seed Data
 *
 * Default accounts for school finance management
 */

import { AccountType, BalanceType } from "@prisma/client"

import { db } from "@/lib/db"

// Helper function to determine normal balance based on account type
function getNormalBalance(accountType: AccountType): BalanceType {
  switch (accountType) {
    case AccountType.ASSET:
    case AccountType.EXPENSE:
      return BalanceType.DEBIT
    case AccountType.LIABILITY:
    case AccountType.EQUITY:
    case AccountType.REVENUE:
      return BalanceType.CREDIT
    default:
      return BalanceType.DEBIT
  }
}

interface AccountSeedData {
  code: string
  name: string
  type: AccountType
  description: string
  isActive: boolean
  parentAccountCode?: string
}

/**
 * Standard chart of accounts for schools
 */
const standardAccounts: AccountSeedData[] = [
  // ===== ASSETS =====
  {
    code: "1000",
    name: "Cash",
    type: AccountType.ASSET,
    description: "Cash on hand and in registers",
    isActive: true,
  },
  {
    code: "1010",
    name: "Bank Account - Operating",
    type: AccountType.ASSET,
    description: "Main operating bank account",
    isActive: true,
  },
  {
    code: "1020",
    name: "Bank Account - Payroll",
    type: AccountType.ASSET,
    description: "Dedicated payroll bank account",
    isActive: true,
  },
  {
    code: "1200",
    name: "Accounts Receivable",
    type: AccountType.ASSET,
    description: "Amounts owed by customers",
    isActive: true,
  },
  {
    code: "1210",
    name: "Student Fees Receivable",
    type: AccountType.ASSET,
    description: "Unpaid student fees",
    isActive: true,
  },
  {
    code: "1300",
    name: "Prepaid Expenses",
    type: AccountType.ASSET,
    description: "Expenses paid in advance",
    isActive: true,
  },
  {
    code: "1500",
    name: "Fixed Assets",
    type: AccountType.ASSET,
    description: "Property, equipment, and vehicles",
    isActive: true,
  },
  {
    code: "1510",
    name: "Buildings",
    type: AccountType.ASSET,
    description: "School buildings and structures",
    isActive: true,
    parentAccountCode: "1500",
  },
  {
    code: "1520",
    name: "Equipment",
    type: AccountType.ASSET,
    description: "Computers, furniture, and equipment",
    isActive: true,
    parentAccountCode: "1500",
  },

  // ===== LIABILITIES =====
  {
    code: "2000",
    name: "Accounts Payable",
    type: AccountType.LIABILITY,
    description: "Amounts owed to suppliers",
    isActive: true,
  },
  {
    code: "2100",
    name: "Salary Payable",
    type: AccountType.LIABILITY,
    description: "Accrued salary obligations",
    isActive: true,
  },
  {
    code: "2200",
    name: "Tax Payable",
    type: AccountType.LIABILITY,
    description: "Income tax withholdings",
    isActive: true,
  },
  {
    code: "2210",
    name: "Social Security Payable",
    type: AccountType.LIABILITY,
    description: "Social security withholdings",
    isActive: true,
  },
  {
    code: "2300",
    name: "Unearned Revenue",
    type: AccountType.LIABILITY,
    description: "Advance payments from parents/students",
    isActive: true,
  },
  {
    code: "2400",
    name: "Loans Payable",
    type: AccountType.LIABILITY,
    description: "Long-term loans and financing",
    isActive: true,
  },

  // ===== EQUITY =====
  {
    code: "3000",
    name: "Retained Earnings",
    type: AccountType.EQUITY,
    description: "Accumulated net income from prior years",
    isActive: true,
  },
  {
    code: "3100",
    name: "Current Year Earnings",
    type: AccountType.EQUITY,
    description: "Net income for current fiscal year",
    isActive: true,
  },

  // ===== REVENUE =====
  {
    code: "4000",
    name: "Student Fees Revenue",
    type: AccountType.REVENUE,
    description: "Revenue from student fees",
    isActive: true,
  },
  {
    code: "4010",
    name: "Tuition Revenue",
    type: AccountType.REVENUE,
    description: "Tuition fees",
    isActive: true,
    parentAccountCode: "4000",
  },
  {
    code: "4020",
    name: "Registration Fees",
    type: AccountType.REVENUE,
    description: "Registration and enrollment fees",
    isActive: true,
    parentAccountCode: "4000",
  },
  {
    code: "4030",
    name: "Exam Fees",
    type: AccountType.REVENUE,
    description: "Examination and testing fees",
    isActive: true,
    parentAccountCode: "4000",
  },
  {
    code: "4040",
    name: "Library Fees",
    type: AccountType.REVENUE,
    description: "Library usage and late fees",
    isActive: true,
    parentAccountCode: "4000",
  },
  {
    code: "4050",
    name: "Laboratory Fees",
    type: AccountType.REVENUE,
    description: "Laboratory and practical fees",
    isActive: true,
    parentAccountCode: "4000",
  },
  {
    code: "4060",
    name: "Transport Fees",
    type: AccountType.REVENUE,
    description: "School transportation fees",
    isActive: true,
    parentAccountCode: "4000",
  },
  {
    code: "4900",
    name: "Other Revenue",
    type: AccountType.REVENUE,
    description: "Miscellaneous income",
    isActive: true,
  },

  // ===== EXPENSES =====
  {
    code: "5000",
    name: "Salary Expense",
    type: AccountType.EXPENSE,
    description: "Staff salaries and wages",
    isActive: true,
  },
  {
    code: "5010",
    name: "Teaching Salary",
    type: AccountType.EXPENSE,
    description: "Teacher salaries",
    isActive: true,
    parentAccountCode: "5000",
  },
  {
    code: "5020",
    name: "Administrative Salary",
    type: AccountType.EXPENSE,
    description: "Administrative staff salaries",
    isActive: true,
    parentAccountCode: "5000",
  },
  {
    code: "5100",
    name: "Payroll Tax Expense",
    type: AccountType.EXPENSE,
    description: "Employer payroll taxes",
    isActive: true,
  },
  {
    code: "5200",
    name: "Utilities Expense",
    type: AccountType.EXPENSE,
    description: "Electricity, water, gas, internet",
    isActive: true,
  },
  {
    code: "5300",
    name: "Supplies Expense",
    type: AccountType.EXPENSE,
    description: "Office and teaching supplies",
    isActive: true,
  },
  {
    code: "5400",
    name: "Maintenance Expense",
    type: AccountType.EXPENSE,
    description: "Building and equipment maintenance",
    isActive: true,
  },
  {
    code: "5500",
    name: "Insurance Expense",
    type: AccountType.EXPENSE,
    description: "Insurance premiums",
    isActive: true,
  },
  {
    code: "5600",
    name: "Marketing Expense",
    type: AccountType.EXPENSE,
    description: "Advertising and saas-marketing costs",
    isActive: true,
  },
  {
    code: "5700",
    name: "Professional Fees",
    type: AccountType.EXPENSE,
    description: "Legal, accounting, consulting fees",
    isActive: true,
  },
  {
    code: "5800",
    name: "Depreciation Expense",
    type: AccountType.EXPENSE,
    description: "Asset depreciation",
    isActive: true,
  },
  {
    code: "5900",
    name: "Other Expense",
    type: AccountType.EXPENSE,
    description: "Miscellaneous expenses",
    isActive: true,
  },
]

/**
 * Seed chart of accounts for a school
 */
export async function seedChartOfAccounts(schoolId: string): Promise<void> {
  console.log(`Seeding chart of accounts for school: ${schoolId}`)

  // Check if accounts already exist
  const existingCount = await db.chartOfAccount.count({
    where: { schoolId },
  })

  if (existingCount > 0) {
    console.log(
      `Chart of accounts already seeded (${existingCount} accounts exist)`
    )
    return
  }

  // Create accounts
  for (const account of standardAccounts) {
    await db.chartOfAccount.create({
      data: {
        schoolId,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: getNormalBalance(account.type),
        description: account.description,
        isActive: account.isActive,
      },
    })
  }

  console.log(`Successfully seeded ${standardAccounts.length} accounts`)
}

/**
 * Get or create default fiscal year
 */
export async function getOrCreateFiscalYear(
  schoolId: string,
  year?: number
): Promise<string> {
  const fiscalYear = year || new Date().getFullYear()
  const fiscalYearName = `FY ${fiscalYear}-${fiscalYear + 1}`

  let existingYear = await db.fiscalYear.findFirst({
    where: {
      schoolId,
      name: fiscalYearName,
    },
  })

  if (!existingYear) {
    existingYear = await db.fiscalYear.create({
      data: {
        schoolId,
        name: fiscalYearName,
        startDate: new Date(fiscalYear, 0, 1),
        endDate: new Date(fiscalYear, 11, 31),
        isCurrent: true,
      },
    })
  }

  return existingYear.id
}

/**
 * Initialize accounting system for a school
 */
export async function initializeAccountingSystem(schoolId: string): Promise<{
  success: boolean
  accountsCreated: number
  fiscalYearId: string
}> {
  try {
    // Seed chart of accounts
    await seedChartOfAccounts(schoolId)

    // Create fiscal year
    const fiscalYearId = await getOrCreateFiscalYear(schoolId)

    // Count created accounts
    const accountsCreated = await db.chartOfAccount.count({
      where: { schoolId },
    })

    return {
      success: true,
      accountsCreated,
      fiscalYearId,
    }
  } catch (error) {
    console.error("Error initializing accounting system:", error)
    throw error
  }
}
