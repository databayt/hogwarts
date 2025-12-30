/**
 * Finance Seed
 * Creates Chart of Accounts, Fiscal Years, Budgets, Expenses, Journal Entries
 *
 * Phase 9: Finance (Enhanced with 2-year history)
 *
 * Features:
 * - Chart of Accounts (46 accounts)
 * - Fiscal Years (2024-2025 closed + 2025-2026 current)
 * - Expense Categories (mapped to expense accounts)
 * - Budgets per department per fiscal year
 * - 200+ Expenses (100 historical + 100 current)
 * - 100+ Journal Entries with ledger entries
 *
 * Note: ChartOfAccount model uses:
 * - @@unique([schoolId, code])
 * - Field names: code, name, type (not accountCode, accountName, accountType)
 * - Required field: normalBalance (DEBIT/CREDIT)
 * - Parent reference: parentId (not parentAccountId)
 */

import type { PrismaClient } from "@prisma/client"
import type { Decimal } from "@prisma/client/runtime/library"

import type { DepartmentRef, UserRef } from "./types"
import {
  logPhase,
  logSuccess,
  processBatch,
  randomElement,
  randomNumber,
} from "./utils"

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

// ============================================================================
// EXPENSE CATEGORIES
// ============================================================================

// Expense categories mapped to expense account codes
const EXPENSE_CATEGORIES = [
  {
    name: "Teacher Salaries",
    description: "Monthly salary payments for teaching staff",
    accountCode: "5110",
    requiresApproval: true,
  },
  {
    name: "Staff Salaries",
    description: "Monthly salary payments for non-teaching staff",
    accountCode: "5120",
    requiresApproval: true,
  },
  {
    name: "Employee Benefits",
    description: "Health insurance, pension contributions, allowances",
    accountCode: "5130",
    requiresApproval: true,
  },
  {
    name: "Utilities",
    description: "Electricity, water, internet, telephone",
    accountCode: "5210",
    requiresApproval: false,
  },
  {
    name: "Maintenance",
    description: "Building repairs, equipment maintenance, cleaning",
    accountCode: "5220",
    requiresApproval: true,
  },
  {
    name: "Office Supplies",
    description: "Stationery, printing, office equipment",
    accountCode: "5230",
    requiresApproval: false,
  },
  {
    name: "Insurance",
    description: "Building insurance, liability insurance",
    accountCode: "5240",
    requiresApproval: true,
  },
  {
    name: "Books & Materials",
    description: "Textbooks, workbooks, educational materials",
    accountCode: "5310",
    requiresApproval: true,
  },
  {
    name: "Technology",
    description: "Computers, software licenses, IT equipment",
    accountCode: "5320",
    requiresApproval: true,
  },
  {
    name: "Activities",
    description: "Field trips, sports events, cultural programs",
    accountCode: "5330",
    requiresApproval: true,
  },
]

// ============================================================================
// VENDOR DATA
// ============================================================================

const VENDORS = [
  "Al-Nil Stationery",
  "Khartoum Electric Co.",
  "Sudan Water Authority",
  "Tech Solutions Ltd.",
  "Office Supplies Plus",
  "Building Maintenance Co.",
  "Educational Books Ltd.",
  "Insurance Partners",
  "IT Systems Sudan",
  "Transportation Services",
  "Cleaning Supplies Co.",
  "Food Catering Services",
  "Security Services Ltd.",
  "Printing Press Sudan",
  "Furniture Warehouse",
]

const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  "Teacher Salaries": [
    "Monthly salary payment - Teaching staff",
    "Salary disbursement - Academic department",
    "Monthly wages - Full-time teachers",
    "Payroll processing - Teaching staff",
  ],
  "Staff Salaries": [
    "Monthly salary - Administrative staff",
    "Wages payment - Support staff",
    "Payroll - Non-teaching personnel",
    "Monthly compensation - Office staff",
  ],
  "Employee Benefits": [
    "Health insurance premium",
    "Pension fund contribution",
    "Housing allowance payment",
    "Transportation allowance",
    "Medical reimbursement",
  ],
  Utilities: [
    "Electricity bill - Main building",
    "Water utility charges",
    "Internet service - Monthly",
    "Telephone charges",
    "Generator fuel purchase",
  ],
  Maintenance: [
    "Building repair works",
    "AC maintenance contract",
    "Plumbing repairs",
    "Electrical maintenance",
    "Painting and renovation",
    "Furniture repair",
  ],
  "Office Supplies": [
    "Monthly stationery purchase",
    "Printer cartridges and toner",
    "Office equipment supplies",
    "Filing and storage materials",
  ],
  Insurance: [
    "Annual building insurance premium",
    "Liability insurance payment",
    "Vehicle insurance renewal",
    "Equipment insurance",
  ],
  "Books & Materials": [
    "Textbook procurement",
    "Science lab materials",
    "Library book purchase",
    "Educational workbooks",
    "Art and craft supplies",
  ],
  Technology: [
    "Computer hardware purchase",
    "Software license renewal",
    "Projector maintenance",
    "Network equipment upgrade",
    "IT support services",
  ],
  Activities: [
    "Field trip expenses",
    "Sports day organization",
    "Cultural event costs",
    "Science fair materials",
    "Annual day celebration",
  ],
}

// ============================================================================
// FISCAL YEAR SEEDING
// ============================================================================

export interface FiscalYearRef {
  id: string
  name: string
  isCurrent: boolean
  isClosed: boolean
  startDate: Date
  endDate: Date
}

/**
 * Seed fiscal years (2024-2025 closed + 2025-2026 current)
 */
export async function seedFiscalYears(
  prisma: PrismaClient,
  schoolId: string
): Promise<FiscalYearRef[]> {
  const fiscalYears: FiscalYearRef[] = []

  // 2024-2025 - Closed historical year
  const fy2024 = await prisma.fiscalYear.upsert({
    where: {
      schoolId_name: {
        schoolId,
        name: "FY 2024-2025",
      },
    },
    update: {},
    create: {
      schoolId,
      name: "FY 2024-2025",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-08-31"),
      isCurrent: false,
      isClosed: true,
      closedAt: new Date("2025-09-15"),
    },
  })
  fiscalYears.push({
    id: fy2024.id,
    name: fy2024.name,
    isCurrent: fy2024.isCurrent,
    isClosed: fy2024.isClosed,
    startDate: fy2024.startDate,
    endDate: fy2024.endDate,
  })

  // 2025-2026 - Current active year
  const fy2025 = await prisma.fiscalYear.upsert({
    where: {
      schoolId_name: {
        schoolId,
        name: "FY 2025-2026",
      },
    },
    update: {},
    create: {
      schoolId,
      name: "FY 2025-2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-08-31"),
      isCurrent: true,
      isClosed: false,
    },
  })
  fiscalYears.push({
    id: fy2025.id,
    name: fy2025.name,
    isCurrent: fy2025.isCurrent,
    isClosed: fy2025.isClosed,
    startDate: fy2025.startDate,
    endDate: fy2025.endDate,
  })

  logSuccess("Fiscal Years", fiscalYears.length, "2024-2025 + 2025-2026")
  return fiscalYears
}

// ============================================================================
// EXPENSE CATEGORY SEEDING
// ============================================================================

export interface ExpenseCategoryRef {
  id: string
  name: string
  accountCode?: string
}

/**
 * Seed expense categories linked to chart of accounts
 */
export async function seedExpenseCategories(
  prisma: PrismaClient,
  schoolId: string
): Promise<ExpenseCategoryRef[]> {
  const categories: ExpenseCategoryRef[] = []

  for (const cat of EXPENSE_CATEGORIES) {
    // Find the linked account
    const account = await prisma.chartOfAccount.findUnique({
      where: {
        schoolId_code: {
          schoolId,
          code: cat.accountCode,
        },
      },
    })

    try {
      const category = await prisma.expenseCategory.upsert({
        where: {
          schoolId_name: {
            schoolId,
            name: cat.name,
          },
        },
        update: {
          description: cat.description,
          accountId: account?.id,
          requiresApproval: cat.requiresApproval,
        },
        create: {
          schoolId,
          name: cat.name,
          description: cat.description,
          accountId: account?.id,
          requiresApproval: cat.requiresApproval,
          isActive: true,
        },
      })
      categories.push({
        id: category.id,
        name: category.name,
        accountCode: cat.accountCode,
      })
    } catch {
      // Skip if creation fails
    }
  }

  logSuccess("Expense Categories", categories.length, "linked to accounts")
  return categories
}

// ============================================================================
// BUDGET SEEDING
// ============================================================================

export interface BudgetRef {
  id: string
  name: string
  fiscalYearId: string
  totalAmount: Decimal
}

/**
 * Seed budgets for each fiscal year
 */
export async function seedBudgets(
  prisma: PrismaClient,
  schoolId: string,
  fiscalYears: FiscalYearRef[],
  departments: DepartmentRef[],
  categories: ExpenseCategoryRef[],
  adminUser: UserRef | null
): Promise<BudgetRef[]> {
  const budgets: BudgetRef[] = []
  const createdBy = adminUser?.id || "system"

  for (const fy of fiscalYears) {
    // Create overall school budget
    const budgetName = `School Budget ${fy.name}`
    const totalAmount = fy.isClosed ? 500000 : 550000 // SDG (higher for current year)

    try {
      const budget = await prisma.budget.upsert({
        where: {
          id: `budget-${schoolId}-${fy.name}`.replace(/\s+/g, "-"),
        },
        update: {
          totalAmount,
          status: fy.isClosed ? "CLOSED" : "ACTIVE",
        },
        create: {
          id: `budget-${schoolId}-${fy.name}`.replace(/\s+/g, "-"),
          schoolId,
          fiscalYearId: fy.id,
          name: budgetName,
          description: `Annual budget allocation for ${fy.name}`,
          totalAmount,
          status: fy.isClosed ? "CLOSED" : "ACTIVE",
          createdBy,
          approvedBy: createdBy,
          approvedAt: new Date(
            fy.startDate.getTime() - 7 * 24 * 60 * 60 * 1000
          ),
        },
      })

      budgets.push({
        id: budget.id,
        name: budget.name,
        fiscalYearId: budget.fiscalYearId,
        totalAmount: budget.totalAmount,
      })

      // Create allocations per category
      const allocationAmounts: Record<string, number> = {
        "Teacher Salaries": 200000,
        "Staff Salaries": 80000,
        "Employee Benefits": 50000,
        Utilities: 40000,
        Maintenance: 30000,
        "Office Supplies": 15000,
        Insurance: 20000,
        "Books & Materials": 35000,
        Technology: 25000,
        Activities: 20000,
      }

      for (const cat of categories) {
        const allocated = allocationAmounts[cat.name] || 10000
        // For closed year, spent equals ~95% of allocated
        // For current year, spent equals ~30% (YTD)
        const spentRatio = fy.isClosed ? 0.95 : 0.3
        const spent = Math.round(allocated * spentRatio)

        try {
          await prisma.budgetAllocation.upsert({
            where: {
              budgetId_categoryId: {
                budgetId: budget.id,
                categoryId: cat.id,
              },
            },
            update: {
              spent,
              remaining: allocated - spent,
            },
            create: {
              schoolId,
              budgetId: budget.id,
              categoryId: cat.id,
              allocated,
              spent,
              remaining: allocated - spent,
            },
          })
        } catch {
          // Skip if allocation creation fails
        }
      }
    } catch {
      // Skip if budget creation fails
    }
  }

  logSuccess(
    "Budgets",
    budgets.length,
    `with ${categories.length * budgets.length} allocations`
  )
  return budgets
}

// ============================================================================
// EXPENSE SEEDING
// ============================================================================

/**
 * Generate expense number
 */
function generateExpenseNumber(index: number, year: string): string {
  const paddedIndex = String(index).padStart(4, "0")
  return `EXP-${year}-${paddedIndex}`
}

/**
 * Generate random date within fiscal year
 */
function generateDateInFiscalYear(fy: FiscalYearRef, progress = 1): Date {
  const startMs = fy.startDate.getTime()
  const endMs = fy.isClosed
    ? fy.endDate.getTime()
    : Math.min(Date.now(), fy.endDate.getTime())
  const rangeMs = (endMs - startMs) * progress
  const randomMs = Math.random() * rangeMs
  const date = new Date(startMs + randomMs)
  date.setHours(randomNumber(8, 17), randomNumber(0, 59), 0, 0)
  return date
}

/**
 * Seed expenses (200+ records across 2 fiscal years)
 */
export async function seedExpenses(
  prisma: PrismaClient,
  schoolId: string,
  fiscalYears: FiscalYearRef[],
  categories: ExpenseCategoryRef[],
  adminUser: UserRef | null
): Promise<number> {
  let expenseCount = 0
  const submittedBy = adminUser?.id || "system"

  // Generate expenses for each fiscal year
  for (const fy of fiscalYears) {
    const year = fy.name.split(" ")[1].split("-")[0] // Extract "2024" or "2025"
    const targetCount = fy.isClosed ? 100 : 100 // 100 per year

    const expensesToCreate: Array<{
      category: ExpenseCategoryRef
      amount: number
      date: Date
      vendor: string
      description: string
      status: "PENDING" | "APPROVED" | "PAID" | "REJECTED"
      index: number
    }> = []

    for (let i = 0; i < targetCount; i++) {
      const category = randomElement(categories)
      const descriptions = EXPENSE_DESCRIPTIONS[category.name] || [
        "General expense",
      ]

      // Amount varies by category
      let baseAmount: number
      switch (category.name) {
        case "Teacher Salaries":
        case "Staff Salaries":
          baseAmount = randomNumber(15000, 25000)
          break
        case "Employee Benefits":
          baseAmount = randomNumber(3000, 8000)
          break
        case "Insurance":
          baseAmount = randomNumber(5000, 15000)
          break
        case "Utilities":
          baseAmount = randomNumber(2000, 5000)
          break
        case "Maintenance":
          baseAmount = randomNumber(1000, 10000)
          break
        case "Technology":
          baseAmount = randomNumber(2000, 15000)
          break
        case "Books & Materials":
          baseAmount = randomNumber(1000, 8000)
          break
        default:
          baseAmount = randomNumber(500, 3000)
      }

      // Status distribution
      let status: "PENDING" | "APPROVED" | "PAID" | "REJECTED"
      if (fy.isClosed) {
        // Historical: mostly paid
        const rand = Math.random()
        if (rand < 0.9) status = "PAID"
        else if (rand < 0.95) status = "APPROVED"
        else status = "REJECTED"
      } else {
        // Current: mix of statuses
        const rand = Math.random()
        if (rand < 0.5) status = "PAID"
        else if (rand < 0.7) status = "APPROVED"
        else if (rand < 0.9) status = "PENDING"
        else status = "REJECTED"
      }

      expensesToCreate.push({
        category,
        amount: baseAmount,
        date: generateDateInFiscalYear(fy),
        vendor: randomElement(VENDORS),
        description: randomElement(descriptions),
        status,
        index: i + 1,
      })
    }

    // Sort by date for realistic numbering
    expensesToCreate.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Create expenses in batches
    await processBatch(expensesToCreate, 25, async (exp, idx) => {
      const expenseNumber = generateExpenseNumber(idx + 1, year)

      try {
        // Check if exists first
        const existing = await prisma.expense.findUnique({
          where: { expenseNumber },
        })

        if (!existing) {
          await prisma.expense.create({
            data: {
              schoolId,
              expenseNumber,
              categoryId: exp.category.id,
              amount: exp.amount,
              expenseDate: exp.date,
              vendor: exp.vendor,
              description: exp.description,
              paymentMethod:
                exp.amount > 5000
                  ? "BANK_TRANSFER"
                  : randomElement(["CASH", "CHEQUE", "BANK_TRANSFER"]),
              status: exp.status,
              submittedBy,
              submittedAt: exp.date,
              approvedBy:
                exp.status !== "PENDING" && exp.status !== "REJECTED"
                  ? submittedBy
                  : null,
              approvedAt:
                exp.status !== "PENDING" && exp.status !== "REJECTED"
                  ? new Date(
                      exp.date.getTime() +
                        randomNumber(1, 3) * 24 * 60 * 60 * 1000
                    )
                  : null,
              paidAt:
                exp.status === "PAID"
                  ? new Date(
                      exp.date.getTime() +
                        randomNumber(3, 7) * 24 * 60 * 60 * 1000
                    )
                  : null,
              rejectionReason:
                exp.status === "REJECTED"
                  ? randomElement([
                      "Exceeds budget allocation",
                      "Missing documentation",
                      "Duplicate submission",
                      "Not approved by department head",
                    ])
                  : null,
            },
          })
          expenseCount++
        }
      } catch {
        // Skip if creation fails
      }
    })
  }

  logSuccess("Expenses", expenseCount, "across 2 fiscal years")
  return expenseCount
}

// ============================================================================
// JOURNAL ENTRY SEEDING
// ============================================================================

/**
 * Generate journal entry number
 */
function generateJournalEntryNumber(index: number, year: string): string {
  const paddedIndex = String(index).padStart(5, "0")
  return `JE-${year}-${paddedIndex}`
}

/**
 * Seed journal entries with ledger entries
 * Double-entry bookkeeping: each entry has balanced debits and credits
 */
export async function seedJournalEntries(
  prisma: PrismaClient,
  schoolId: string,
  fiscalYears: FiscalYearRef[],
  adminUser: UserRef | null
): Promise<number> {
  let entryCount = 0
  const createdBy = adminUser?.id || "system"

  // Get account IDs for journal entries
  const accounts = await prisma.chartOfAccount.findMany({
    where: { schoolId },
    select: { id: true, code: true, name: true, type: true },
  })

  const accountMap = new Map(accounts.map((a) => [a.code, a]))

  // Journal entry templates
  const JOURNAL_TEMPLATES = [
    {
      description: "Tuition fee collection",
      sourceModule: "fees",
      debit: "1120", // Bank Account - Operating
      credit: "4100", // Tuition Revenue
      amountRange: [5000, 50000],
    },
    {
      description: "Registration fee collection",
      sourceModule: "fees",
      debit: "1120",
      credit: "4210", // Registration Fees
      amountRange: [500, 2000],
    },
    {
      description: "Monthly salary payment - Teachers",
      sourceModule: "payroll",
      debit: "5110", // Teacher Salaries
      credit: "1120",
      amountRange: [80000, 150000],
    },
    {
      description: "Monthly salary payment - Staff",
      sourceModule: "payroll",
      debit: "5120", // Staff Salaries
      credit: "1120",
      amountRange: [30000, 60000],
    },
    {
      description: "Utility bill payment",
      sourceModule: "expenses",
      debit: "5210", // Utilities
      credit: "1120",
      amountRange: [2000, 8000],
    },
    {
      description: "Equipment purchase",
      sourceModule: "expenses",
      debit: "1320", // Equipment
      credit: "1120",
      amountRange: [5000, 30000],
    },
    {
      description: "Office supplies purchase",
      sourceModule: "expenses",
      debit: "5230", // Supplies
      credit: "1110", // Petty Cash
      amountRange: [200, 1500],
    },
    {
      description: "Maintenance work payment",
      sourceModule: "expenses",
      debit: "5220", // Maintenance
      credit: "1120",
      amountRange: [1000, 10000],
    },
    {
      description: "Textbook procurement",
      sourceModule: "expenses",
      debit: "5310", // Books and Materials
      credit: "2110", // Supplier Payables
      amountRange: [5000, 25000],
    },
    {
      description: "Insurance premium payment",
      sourceModule: "expenses",
      debit: "5240", // Insurance
      credit: "1120",
      amountRange: [10000, 30000],
    },
  ]

  for (const fy of fiscalYears) {
    const year = fy.name.split(" ")[1].split("-")[0]
    const targetCount = fy.isClosed ? 60 : 40 // More entries for closed year

    const entriesToCreate: Array<{
      template: (typeof JOURNAL_TEMPLATES)[0]
      date: Date
      amount: number
      index: number
    }> = []

    for (let i = 0; i < targetCount; i++) {
      const template = randomElement(JOURNAL_TEMPLATES)
      const amount = randomNumber(
        template.amountRange[0],
        template.amountRange[1]
      )

      entriesToCreate.push({
        template,
        date: generateDateInFiscalYear(fy),
        amount,
        index: i + 1,
      })
    }

    // Sort by date
    entriesToCreate.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Create entries
    for (let i = 0; i < entriesToCreate.length; i++) {
      const entry = entriesToCreate[i]
      const entryNumber = generateJournalEntryNumber(i + 1, year)

      try {
        // Check if exists
        const existing = await prisma.journalEntry.findUnique({
          where: { entryNumber },
        })

        if (!existing) {
          const debitAccount = accountMap.get(entry.template.debit)
          const creditAccount = accountMap.get(entry.template.credit)

          if (debitAccount && creditAccount) {
            const journalEntry = await prisma.journalEntry.create({
              data: {
                schoolId,
                entryNumber,
                entryDate: entry.date,
                description: entry.template.description,
                sourceModule: entry.template.sourceModule,
                isPosted: true,
                postedAt: new Date(
                  entry.date.getTime() +
                    randomNumber(0, 2) * 24 * 60 * 60 * 1000
                ),
                postedBy: createdBy,
                fiscalYearId: fy.id,
                createdBy,
              },
            })

            // Create ledger entries (balanced double-entry)
            await prisma.ledgerEntry.createMany({
              data: [
                {
                  schoolId,
                  journalEntryId: journalEntry.id,
                  accountId: debitAccount.id,
                  debit: entry.amount,
                  credit: 0,
                  description: entry.template.description,
                },
                {
                  schoolId,
                  journalEntryId: journalEntry.id,
                  accountId: creditAccount.id,
                  debit: 0,
                  credit: entry.amount,
                  description: entry.template.description,
                },
              ],
            })

            entryCount++
          }
        }
      } catch {
        // Skip if creation fails
      }
    }
  }

  logSuccess("Journal Entries", entryCount, "with balanced ledger entries")
  return entryCount
}

// ============================================================================
// MAIN FINANCE SEEDING (ENHANCED)
// ============================================================================

/**
 * Seed all finance data with 2-year history
 */
export async function seedFinanceComplete(
  prisma: PrismaClient,
  schoolId: string,
  departments: DepartmentRef[],
  adminUser: UserRef | null
): Promise<{
  accountCount: number
  fiscalYears: FiscalYearRef[]
  categories: ExpenseCategoryRef[]
  budgets: BudgetRef[]
  expenseCount: number
  journalEntryCount: number
}> {
  logPhase(9, "FINANCE", "المالية والمحاسبة")

  // 1. Seed chart of accounts (existing)
  const accountCount = await seedChartOfAccounts(prisma, schoolId)

  // 2. Seed fiscal years
  const fiscalYears = await seedFiscalYears(prisma, schoolId)

  // 3. Seed expense categories
  const categories = await seedExpenseCategories(prisma, schoolId)

  // 4. Seed budgets with allocations
  const budgets = await seedBudgets(
    prisma,
    schoolId,
    fiscalYears,
    departments,
    categories,
    adminUser
  )

  // 5. Seed expenses
  const expenseCount = await seedExpenses(
    prisma,
    schoolId,
    fiscalYears,
    categories,
    adminUser
  )

  // 6. Seed journal entries
  const journalEntryCount = await seedJournalEntries(
    prisma,
    schoolId,
    fiscalYears,
    adminUser
  )

  return {
    accountCount,
    fiscalYears,
    categories,
    budgets,
    expenseCount,
    journalEntryCount,
  }
}

/**
 * Seed chart of accounts only (extracted for reuse)
 */
async function seedChartOfAccounts(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
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
