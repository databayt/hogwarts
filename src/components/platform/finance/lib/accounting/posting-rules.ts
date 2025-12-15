/**
 * Posting Rules for Finance Modules
 *
 * Defines how each finance module's transactions map to journal entries
 */

import type { JournalEntryInput, JournalEntryLine } from "./types"
import { SourceModule } from "./types"
import { toCents } from "./utils"

/**
 * Standard account codes for chart of accounts
 * Schools can customize these during setup
 */
export const StandardAccountCodes = {
  // Assets
  CASH: "1000",
  BANK_ACCOUNT: "1010",
  ACCOUNTS_RECEIVABLE: "1200",
  STUDENT_FEES_RECEIVABLE: "1210",
  PREPAID_EXPENSES: "1300",

  // Liabilities
  ACCOUNTS_PAYABLE: "2000",
  SALARY_PAYABLE: "2100",
  TAX_PAYABLE: "2200",
  SOCIAL_SECURITY_PAYABLE: "2210",
  UNEARNED_REVENUE: "2300",

  // Equity
  RETAINED_EARNINGS: "3000",
  CURRENT_YEAR_EARNINGS: "3100",

  // Revenue
  STUDENT_FEES_REVENUE: "4000",
  TUITION_REVENUE: "4010",
  REGISTRATION_FEES: "4020",
  EXAM_FEES: "4030",
  OTHER_REVENUE: "4900",

  // Expenses
  SALARY_EXPENSE: "5000",
  TEACHING_SALARY: "5010",
  ADMIN_SALARY: "5020",
  PAYROLL_TAX_EXPENSE: "5100",
  UTILITIES_EXPENSE: "5200",
  SUPPLIES_EXPENSE: "5300",
  MAINTENANCE_EXPENSE: "5400",
  OTHER_EXPENSE: "5900",
} as const

/**
 * Get account by code or create mapping
 */
async function getAccountIdByCode(
  schoolId: string,
  accountCode: string,
  db: any
): Promise<string | null> {
  const account = await db.chartOfAccount.findFirst({
    where: {
      schoolId,
      accountCode,
    },
  })

  return account?.id || null
}

/**
 * Fee Payment Posting Rule
 *
 * When a student pays a fee:
 * DR: Cash/Bank Account
 * CR: Student Fees Receivable (if previously recorded)
 * CR: Fee Revenue (if direct payment)
 */
export async function createFeePaymentEntry(
  schoolId: string,
  paymentData: {
    paymentId: string
    studentId: string
    amount: number
    paymentMethod: string
    paymentDate: Date
    feeType?: string
  },
  db: any
): Promise<JournalEntryInput> {
  // Get account IDs
  const cashAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.CASH,
    db
  )
  const receivableAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.STUDENT_FEES_RECEIVABLE,
    db
  )
  const revenueAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.STUDENT_FEES_REVENUE,
    db
  )

  if (!cashAccountId || !receivableAccountId || !revenueAccountId) {
    throw new Error("Required accounts not found in chart of accounts")
  }

  const amount = toCents(paymentData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: cashAccountId,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: amount,
      credit: 0,
      description: `Fee payment received from student`,
    },
    {
      accountId: receivableAccountId,
      accountCode: StandardAccountCodes.STUDENT_FEES_RECEIVABLE,
      accountName: "Student Fees Receivable",
      debit: 0,
      credit: amount,
      description: `Fee payment applied`,
    },
  ]

  return {
    entryDate: paymentData.paymentDate,
    description: `Student fee payment - ${paymentData.paymentMethod}`,
    reference: paymentData.paymentId,
    sourceModule: SourceModule.FEES,
    sourceRecordId: paymentData.paymentId,
    lines,
    autoPost: true,
  }
}

/**
 * Fee Assignment Posting Rule
 *
 * When a fee is assigned to a student:
 * DR: Student Fees Receivable
 * CR: Fee Revenue
 */
export async function createFeeAssignmentEntry(
  schoolId: string,
  assignmentData: {
    assignmentId: string
    studentId: string
    amount: number
    feeType: string
    assignedDate: Date
  },
  db: any
): Promise<JournalEntryInput> {
  const receivableAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.STUDENT_FEES_RECEIVABLE,
    db
  )
  const revenueAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.STUDENT_FEES_REVENUE,
    db
  )

  if (!receivableAccountId || !revenueAccountId) {
    throw new Error("Required accounts not found")
  }

  const amount = toCents(assignmentData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: receivableAccountId,
      accountCode: StandardAccountCodes.STUDENT_FEES_RECEIVABLE,
      accountName: "Student Fees Receivable",
      debit: amount,
      credit: 0,
      description: `Fee assigned: ${assignmentData.feeType}`,
    },
    {
      accountId: revenueAccountId,
      accountCode: StandardAccountCodes.STUDENT_FEES_REVENUE,
      accountName: "Student Fees Revenue",
      debit: 0,
      credit: amount,
      description: `Fee revenue recognized`,
    },
  ]

  return {
    entryDate: assignmentData.assignedDate,
    description: `Fee assignment - ${assignmentData.feeType}`,
    reference: assignmentData.assignmentId,
    sourceModule: SourceModule.FEES,
    sourceRecordId: assignmentData.assignmentId,
    lines,
    autoPost: true,
  }
}

/**
 * Salary Payment Posting Rule
 *
 * When salary is paid:
 * DR: Salary Expense
 * DR: Payroll Tax Expense
 * CR: Cash/Bank Account
 * CR: Tax Payable (if withheld)
 * CR: Social Security Payable (if withheld)
 */
export async function createSalaryPaymentEntry(
  schoolId: string,
  paymentData: {
    slipId: string
    teacherId: string
    grossSalary: number
    taxAmount: number
    socialSecurityAmount: number
    netSalary: number
    paymentDate: Date
  },
  db: any
): Promise<JournalEntryInput> {
  const salaryExpenseId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.SALARY_EXPENSE,
    db
  )
  const taxExpenseId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.PAYROLL_TAX_EXPENSE,
    db
  )
  const cashAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.CASH,
    db
  )
  const taxPayableId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.TAX_PAYABLE,
    db
  )
  const ssPayableId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.SOCIAL_SECURITY_PAYABLE,
    db
  )

  if (!salaryExpenseId || !cashAccountId || !taxPayableId || !ssPayableId) {
    throw new Error("Required accounts not found")
  }

  const grossAmount = toCents(paymentData.grossSalary)
  const taxAmount = toCents(paymentData.taxAmount)
  const ssAmount = toCents(paymentData.socialSecurityAmount)
  const netAmount = toCents(paymentData.netSalary)

  const lines: JournalEntryLine[] = [
    {
      accountId: salaryExpenseId,
      accountCode: StandardAccountCodes.SALARY_EXPENSE,
      accountName: "Salary Expense",
      debit: grossAmount,
      credit: 0,
      description: `Salary expense for teacher`,
    },
  ]

  if (taxAmount > 0 && taxExpenseId) {
    lines.push({
      accountId: taxExpenseId,
      accountCode: StandardAccountCodes.PAYROLL_TAX_EXPENSE,
      accountName: "Payroll Tax Expense",
      debit: taxAmount,
      credit: 0,
      description: `Employer payroll tax`,
    })
  }

  lines.push({
    accountId: cashAccountId,
    accountCode: StandardAccountCodes.CASH,
    accountName: "Cash",
    debit: 0,
    credit: netAmount,
    description: `Salary payment to teacher`,
  })

  if (taxAmount > 0) {
    lines.push({
      accountId: taxPayableId,
      accountCode: StandardAccountCodes.TAX_PAYABLE,
      accountName: "Tax Payable",
      debit: 0,
      credit: taxAmount,
      description: `Tax withheld`,
    })
  }

  if (ssAmount > 0) {
    lines.push({
      accountId: ssPayableId,
      accountCode: StandardAccountCodes.SOCIAL_SECURITY_PAYABLE,
      accountName: "Social Security Payable",
      debit: 0,
      credit: ssAmount,
      description: `Social security withheld`,
    })
  }

  return {
    entryDate: paymentData.paymentDate,
    description: `Salary payment`,
    reference: paymentData.slipId,
    sourceModule: SourceModule.PAYROLL,
    sourceRecordId: paymentData.slipId,
    lines,
    autoPost: true,
  }
}

/**
 * Expense Payment Posting Rule
 *
 * When an expense is paid:
 * DR: Expense Account (by category)
 * CR: Cash/Bank Account
 */
export async function createExpensePaymentEntry(
  schoolId: string,
  expenseData: {
    expenseId: string
    categoryName: string
    amount: number
    paymentDate: Date
    description: string
  },
  db: any
): Promise<JournalEntryInput> {
  const expenseAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.OTHER_EXPENSE,
    db
  )
  const cashAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.CASH,
    db
  )

  if (!expenseAccountId || !cashAccountId) {
    throw new Error("Required accounts not found")
  }

  const amount = toCents(expenseData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: expenseAccountId,
      accountCode: StandardAccountCodes.OTHER_EXPENSE,
      accountName: `${expenseData.categoryName} Expense`,
      debit: amount,
      credit: 0,
      description: expenseData.description,
    },
    {
      accountId: cashAccountId,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: 0,
      credit: amount,
      description: `Payment for ${expenseData.categoryName}`,
    },
  ]

  return {
    entryDate: expenseData.paymentDate,
    description: `Expense: ${expenseData.description}`,
    reference: expenseData.expenseId,
    sourceModule: SourceModule.EXPENSES,
    sourceRecordId: expenseData.expenseId,
    lines,
    autoPost: true,
  }
}

/**
 * Invoice Payment Posting Rule
 *
 * When an invoice is paid:
 * DR: Cash/Bank Account
 * CR: Accounts Receivable
 */
export async function createInvoicePaymentEntry(
  schoolId: string,
  invoiceData: {
    invoiceId: string
    amount: number
    paymentDate: Date
    invoiceNumber: string
  },
  db: any
): Promise<JournalEntryInput> {
  const cashAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.CASH,
    db
  )
  const receivableAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.ACCOUNTS_RECEIVABLE,
    db
  )

  if (!cashAccountId || !receivableAccountId) {
    throw new Error("Required accounts not found")
  }

  const amount = toCents(invoiceData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: cashAccountId,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: amount,
      credit: 0,
      description: `Invoice payment received`,
    },
    {
      accountId: receivableAccountId,
      accountCode: StandardAccountCodes.ACCOUNTS_RECEIVABLE,
      accountName: "Accounts Receivable",
      debit: 0,
      credit: amount,
      description: `Payment for invoice ${invoiceData.invoiceNumber}`,
    },
  ]

  return {
    entryDate: invoiceData.paymentDate,
    description: `Invoice payment - ${invoiceData.invoiceNumber}`,
    reference: invoiceData.invoiceId,
    sourceModule: SourceModule.INVOICE,
    sourceRecordId: invoiceData.invoiceId,
    lines,
    autoPost: true,
  }
}

/**
 * Wallet Top-up Posting Rule
 *
 * When a wallet is topped up:
 * DR: Cash/Bank Account
 * CR: Unearned Revenue (liability until used)
 */
export async function createWalletTopupEntry(
  schoolId: string,
  topupData: {
    transactionId: string
    amount: number
    topupDate: Date
  },
  db: any
): Promise<JournalEntryInput> {
  const cashAccountId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.CASH,
    db
  )
  const unearnedRevenueId = await getAccountIdByCode(
    schoolId,
    StandardAccountCodes.UNEARNED_REVENUE,
    db
  )

  if (!cashAccountId || !unearnedRevenueId) {
    throw new Error("Required accounts not found")
  }

  const amount = toCents(topupData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: cashAccountId,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: amount,
      credit: 0,
      description: `Wallet top-up received`,
    },
    {
      accountId: unearnedRevenueId,
      accountCode: StandardAccountCodes.UNEARNED_REVENUE,
      accountName: "Unearned Revenue",
      debit: 0,
      credit: amount,
      description: `Wallet balance increase`,
    },
  ]

  return {
    entryDate: topupData.topupDate,
    description: `Wallet top-up`,
    reference: topupData.transactionId,
    sourceModule: SourceModule.WALLET,
    sourceRecordId: topupData.transactionId,
    lines,
    autoPost: true,
  }
}

/**
 * Budget Allocation Posting Rule
 * Note: Budget allocations are typically memo entries or don't create journal entries
 * They're tracked separately and compared against actual expenses
 */
export function createBudgetAllocationMemo(
  schoolId: string,
  budgetData: {
    allocationId: string
    departmentName: string
    amount: number
    startDate: Date
  }
): string {
  return `Budget allocated: $${budgetData.amount} to ${budgetData.departmentName}`
}
