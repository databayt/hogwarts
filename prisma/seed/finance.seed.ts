/**
 * Comprehensive Finance Module Seed Data
 * Creates complete financial data for Demo International School
 *
 * This seed file populates all 13 finance sub-modules with realistic data
 */

import { PrismaClient } from "@prisma/client"
import { subMonths, addMonths, startOfMonth, endOfMonth, addDays, subDays, format } from "date-fns"

const prisma = new PrismaClient()

export async function seedFinance(schoolId: string, cleanFirst = false) {
  console.log("🏦 Seeding Finance Module...")

  // Clean existing data if requested
  if (cleanFirst) {
    await cleanFinanceData(schoolId)
  }

  // Get current date references
  const now = new Date()
  const currentYear = now.getFullYear()
  const academicYear = `${currentYear}-${currentYear + 1}`

  // 1. Create Fiscal Year
  const fiscalYear = await seedFiscalYear(schoolId, currentYear)

  // 2. Create Chart of Accounts (Double-Entry Bookkeeping)
  const accounts = await seedChartOfAccounts(schoolId)

  // 3. Create Fee Structures (6 grades)
  const feeStructures = await seedFeeStructures(schoolId, academicYear)

  // 4. Get students and create fee assignments
  const students = await prisma.student.findMany({
    where: { schoolId },
    include: {
      studentYearLevels: {
        include: { yearLevel: true }
      }
    }
  })

  if (students.length === 0) {
    console.log("⚠️ No students found. Please run student seed first.")
    return
  }

  const feeAssignments = await seedFeeAssignments(schoolId, students, feeStructures, academicYear)

  // 5. Create Invoices and Payments (80% collection rate)
  const { invoices, payments, receipts } = await seedInvoicesAndPayments(schoolId, students, feeAssignments)

  // 6. Create Bank Accounts (3 accounts)
  const bankAccounts = await seedBankAccounts(schoolId)

  // 7. Create Staff Salary Structures
  const teachers = await prisma.teacher.findMany({ where: { schoolId } })
  const salaryStructures = await seedSalaryStructures(schoolId, teachers)

  // 8. Create Payroll Runs (12 months)
  const payrollRuns = await seedPayrollRuns(schoolId, teachers, salaryStructures, fiscalYear.id)

  // 9. Create Timesheet Entries
  await seedTimesheets(schoolId, teachers)

  // 10. Create Budgets and Allocations
  const budgets = await seedBudgets(schoolId, fiscalYear.id)

  // 11. Create Expense Categories and Expenses
  const expenseCategories = await seedExpenseCategories(schoolId, accounts)
  const expenses = await seedExpenses(schoolId, expenseCategories, budgets)

  // 12. Create Wallets for Parents and Students
  await seedWallets(schoolId, students)

  // 13. Create Bank Transactions
  await seedBankTransactions(schoolId, bankAccounts)

  // 14. Create Financial Reports
  await seedFinancialReports(schoolId, fiscalYear.id)

  // 15. Create Sample Permissions
  await seedFinancePermissions(schoolId)

  console.log("✅ Finance Module seeding completed!")

  return {
    fiscalYear,
    accounts,
    feeStructures,
    feeAssignments,
    invoices,
    payments,
    bankAccounts,
    salaryStructures,
    payrollRuns,
    budgets,
    expenses,
    message: "Finance module seeded successfully"
  }
}

// Clean existing finance data
async function cleanFinanceData(schoolId: string) {
  console.log("🧹 Cleaning existing finance data...")

  // Delete in reverse order of dependencies
  await prisma.financialReport.deleteMany({ where: { schoolId } })
  await prisma.walletTransaction.deleteMany({ where: { schoolId } })
  await prisma.wallet.deleteMany({ where: { schoolId } })
  await prisma.expense.deleteMany({ where: { schoolId } })
  await prisma.budgetAllocation.deleteMany({ where: { schoolId } })
  await prisma.budget.deleteMany({ where: { schoolId } })
  await prisma.expenseCategory.deleteMany({ where: { schoolId } })
  await prisma.salarySlip.deleteMany({ where: { schoolId } })
  await prisma.payrollRun.deleteMany({ where: { schoolId } })
  await prisma.timesheetEntry.deleteMany({ where: { schoolId } })
  await prisma.timesheetPeriod.deleteMany({ where: { schoolId } })
  await prisma.salaryDeduction.deleteMany({ where: { schoolId } })
  await prisma.salaryAllowance.deleteMany({ where: { schoolId } })
  await prisma.salaryStructure.deleteMany({ where: { schoolId } })
  await prisma.transaction.deleteMany({ where: { schoolId } })
  await prisma.bankReconciliation.deleteMany({ where: { schoolId } })
  await prisma.transfer.deleteMany({ where: { schoolId } })
  await prisma.bankAccount.deleteMany({ where: { schoolId } })
  await prisma.refund.deleteMany({ where: { schoolId } })
  await prisma.payment.deleteMany({ where: { schoolId } })
  await prisma.feeAssignment.deleteMany({ where: { schoolId } })
  await prisma.feeStructure.deleteMany({ where: { schoolId } })
  await prisma.userInvoiceItem.deleteMany({ where: { schoolId } })
  await prisma.userInvoice.deleteMany({ where: { schoolId } })
  await prisma.ledgerEntry.deleteMany({ where: { schoolId } })
  await prisma.journalEntry.deleteMany({ where: { schoolId } })
  await prisma.accountBalance.deleteMany({ where: { schoolId } })
  await prisma.chartOfAccount.deleteMany({ where: { schoolId } })
  await prisma.fiscalYear.deleteMany({ where: { schoolId } })
  await prisma.financePermission.deleteMany({ where: { schoolId } })
}

// Seed Fiscal Year
async function seedFiscalYear(schoolId: string, year: number) {
  return await prisma.fiscalYear.create({
    data: {
      schoolId,
      name: `FY ${year}-${year + 1}`,
      startDate: new Date(year, 0, 1), // January 1
      endDate: new Date(year, 11, 31), // December 31
      isCurrent: true,
      isClosed: false
    }
  })
}

// Seed Chart of Accounts
async function seedChartOfAccounts(schoolId: string) {
  const accounts = [
    // ASSETS (1000-1999)
    { code: "1000", name: "Cash and Cash Equivalents", type: "ASSET", subtype: "Current Asset", normalBalance: "DEBIT" },
    { code: "1010", name: "Operating Account", type: "ASSET", subtype: "Bank", normalBalance: "DEBIT", parentCode: "1000" },
    { code: "1020", name: "Savings Account", type: "ASSET", subtype: "Bank", normalBalance: "DEBIT", parentCode: "1000" },
    { code: "1030", name: "Tuition Collection Account", type: "ASSET", subtype: "Bank", normalBalance: "DEBIT", parentCode: "1000" },
    { code: "1100", name: "Accounts Receivable", type: "ASSET", subtype: "Current Asset", normalBalance: "DEBIT" },
    { code: "1110", name: "Student Fee Receivables", type: "ASSET", subtype: "Receivable", normalBalance: "DEBIT", parentCode: "1100" },
    { code: "1200", name: "Inventory", type: "ASSET", subtype: "Current Asset", normalBalance: "DEBIT" },
    { code: "1300", name: "Property and Equipment", type: "ASSET", subtype: "Fixed Asset", normalBalance: "DEBIT" },
    { code: "1310", name: "Buildings", type: "ASSET", subtype: "Fixed Asset", normalBalance: "DEBIT", parentCode: "1300" },
    { code: "1320", name: "Furniture and Fixtures", type: "ASSET", subtype: "Fixed Asset", normalBalance: "DEBIT", parentCode: "1300" },
    { code: "1330", name: "Computer Equipment", type: "ASSET", subtype: "Fixed Asset", normalBalance: "DEBIT", parentCode: "1300" },

    // LIABILITIES (2000-2999)
    { code: "2000", name: "Accounts Payable", type: "LIABILITY", subtype: "Current Liability", normalBalance: "CREDIT" },
    { code: "2100", name: "Salaries Payable", type: "LIABILITY", subtype: "Current Liability", normalBalance: "CREDIT" },
    { code: "2200", name: "Loans Payable", type: "LIABILITY", subtype: "Long-term Liability", normalBalance: "CREDIT" },
    { code: "2300", name: "Deferred Revenue", type: "LIABILITY", subtype: "Current Liability", normalBalance: "CREDIT" },

    // EQUITY (3000-3999)
    { code: "3000", name: "Retained Earnings", type: "EQUITY", subtype: "Equity", normalBalance: "CREDIT" },
    { code: "3100", name: "Current Year Earnings", type: "EQUITY", subtype: "Equity", normalBalance: "CREDIT" },

    // REVENUE (4000-4999)
    { code: "4000", name: "Tuition Revenue", type: "REVENUE", subtype: "Operating Revenue", normalBalance: "CREDIT" },
    { code: "4100", name: "Registration Fee Revenue", type: "REVENUE", subtype: "Operating Revenue", normalBalance: "CREDIT" },
    { code: "4200", name: "Other Revenue", type: "REVENUE", subtype: "Operating Revenue", normalBalance: "CREDIT" },
    { code: "4300", name: "Interest Income", type: "REVENUE", subtype: "Other Revenue", normalBalance: "CREDIT" },

    // EXPENSES (5000-5999)
    { code: "5000", name: "Salaries and Benefits", type: "EXPENSE", subtype: "Operating Expense", normalBalance: "DEBIT" },
    { code: "5010", name: "Teacher Salaries", type: "EXPENSE", subtype: "Salary Expense", normalBalance: "DEBIT", parentCode: "5000" },
    { code: "5020", name: "Administrative Salaries", type: "EXPENSE", subtype: "Salary Expense", normalBalance: "DEBIT", parentCode: "5000" },
    { code: "5100", name: "Utilities", type: "EXPENSE", subtype: "Operating Expense", normalBalance: "DEBIT" },
    { code: "5110", name: "Electricity", type: "EXPENSE", subtype: "Utility", normalBalance: "DEBIT", parentCode: "5100" },
    { code: "5120", name: "Water", type: "EXPENSE", subtype: "Utility", normalBalance: "DEBIT", parentCode: "5100" },
    { code: "5130", name: "Internet and Phone", type: "EXPENSE", subtype: "Utility", normalBalance: "DEBIT", parentCode: "5100" },
    { code: "5200", name: "Supplies and Materials", type: "EXPENSE", subtype: "Operating Expense", normalBalance: "DEBIT" },
    { code: "5300", name: "Maintenance and Repairs", type: "EXPENSE", subtype: "Operating Expense", normalBalance: "DEBIT" },
    { code: "5400", name: "Professional Services", type: "EXPENSE", subtype: "Operating Expense", normalBalance: "DEBIT" },
    { code: "5500", name: "Insurance", type: "EXPENSE", subtype: "Operating Expense", normalBalance: "DEBIT" },
    { code: "5900", name: "Other Expenses", type: "EXPENSE", subtype: "Operating Expense", normalBalance: "DEBIT" }
  ]

  // Create parent accounts first
  const parentAccounts = accounts.filter(a => !a.parentCode)
  const createdParents: Record<string, any> = {}

  for (const account of parentAccounts) {
    const created = await prisma.chartOfAccount.create({
      data: {
        schoolId,
        code: account.code,
        name: account.name,
        type: account.type as any,
        subtype: account.subtype,
        normalBalance: account.normalBalance as any,
        isActive: true,
        description: `${account.name} account for financial tracking`
      }
    })
    createdParents[account.code] = created
  }

  // Create child accounts
  const childAccounts = accounts.filter(a => a.parentCode)
  for (const account of childAccounts) {
    const parent = createdParents[account.parentCode!]
    if (parent) {
      await prisma.chartOfAccount.create({
        data: {
          schoolId,
          code: account.code,
          name: account.name,
          type: account.type as any,
          subtype: account.subtype,
          parentId: parent.id,
          normalBalance: account.normalBalance as any,
          isActive: true,
          description: `${account.name} - Sub-account of ${parent.name}`
        }
      })
    }
  }

  return await prisma.chartOfAccount.findMany({ where: { schoolId } })
}

// Seed Fee Structures
async function seedFeeStructures(schoolId: string, academicYear: string) {
  const feeStructures = [
    { name: "Grade 7 Fee Structure", grade: 7, tuition: 6000, total: 7500 },
    { name: "Grade 8 Fee Structure", grade: 8, tuition: 6000, total: 7500 },
    { name: "Grade 9 Fee Structure", grade: 9, tuition: 6500, total: 8000 },
    { name: "Grade 10 Fee Structure", grade: 10, tuition: 6500, total: 8000 },
    { name: "Grade 11 Fee Structure", grade: 11, tuition: 7000, total: 8500 },
    { name: "Grade 12 Fee Structure", grade: 12, tuition: 7000, total: 8500 }
  ]

  const created = []
  for (const fee of feeStructures) {
    const structure = await prisma.feeStructure.create({
      data: {
        schoolId,
        name: fee.name,
        academicYear,
        description: `Fee structure for Grade ${fee.grade} students`,
        tuitionFee: fee.tuition,
        admissionFee: 500,
        registrationFee: 300,
        examFee: 200,
        libraryFee: 200,
        laboratoryFee: fee.grade >= 9 ? 300 : 0,
        sportsFee: 100,
        transportFee: 0,
        hostelFee: 0,
        totalAmount: fee.total,
        installments: 3,
        paymentSchedule: [
          { dueDate: "September 1", amount: fee.total * 0.34, description: "First Installment" },
          { dueDate: "January 1", amount: fee.total * 0.33, description: "Second Installment" },
          { dueDate: "April 1", amount: fee.total * 0.33, description: "Third Installment" }
        ],
        lateFeeAmount: 50,
        lateFeeType: "FIXED",
        discountPolicy: {
          earlyPayment: { percentage: 5, description: "5% off if paid in full by Aug 15" },
          sibling: { percentage: 10, description: "10% off for second child" }
        },
        isActive: true
      }
    })
    created.push(structure)
  }

  return created
}

// Seed Fee Assignments
async function seedFeeAssignments(
  schoolId: string,
  students: any[],
  feeStructures: any[],
  academicYear: string
) {
  const assignments = []

  for (const student of students) {
    // Find appropriate fee structure based on student's grade
    const gradeLevel = student.studentYearLevels?.[0]?.yearLevel?.levelName?.match(/\d+/)?.[0]
    const grade = gradeLevel ? parseInt(gradeLevel) : 7

    const feeStructure = feeStructures.find(fs =>
      fs.name.includes(`Grade ${grade}`)
    ) || feeStructures[0]

    // Apply random discounts to some students (20% get sibling discount)
    const hasSiblingDiscount = Math.random() < 0.2
    const discount = hasSiblingDiscount ? feeStructure.totalAmount * 0.1 : 0

    const assignment = await prisma.feeAssignment.create({
      data: {
        schoolId,
        studentId: student.id,
        feeStructureId: feeStructure.id,
        academicYear,
        customAmount: hasSiblingDiscount ? feeStructure.totalAmount - discount : null,
        finalAmount: feeStructure.totalAmount - discount,
        discounts: hasSiblingDiscount ? [
          { type: "sibling", amount: discount, reason: "Sibling discount applied" }
        ] : undefined,
        totalDiscount: discount,
        status: Math.random() < 0.8 ? "PARTIAL" : "PENDING" // 80% have made some payment
      }
    })
    assignments.push(assignment)
  }

  return assignments
}

// Seed Invoices and Payments
async function seedInvoicesAndPayments(
  schoolId: string,
  students: any[],
  feeAssignments: any[]
) {
  const invoices: any[] = []
  const payments: any[] = []
  const receipts: any[] = []

  // Get the first user to associate with invoices
  const adminUser = await prisma.user.findFirst({
    where: { schoolId, role: "ADMIN" }
  })

  if (!adminUser) {
    console.log("⚠️ No admin user found for invoices")
    return { invoices, payments, receipts }
  }

  for (const assignment of feeAssignments) {
    const student = students.find(s => s.id === assignment.studentId)
    if (!student) continue

    // Create 3 invoices (for 3 installments)
    const installmentAmount = assignment.finalAmount / 3

    for (let i = 0; i < 3; i++) {
      const invoiceDate = subMonths(new Date(), 3 - i)
      const dueDate = addDays(invoiceDate, 30)

      // Create invoice address entries
      const fromAddress = await prisma.userInvoiceAddress.create({
        data: {
          schoolId,
          name: "Demo International School",
          email: "finance@demo.databayt.org",
          address1: "123 Education Street",
          address2: "Khartoum, Sudan",
        }
      })

      const toAddress = await prisma.userInvoiceAddress.create({
        data: {
          schoolId,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email || "student@demo.databayt.org",
          address1: student.address || "Student Address",
        }
      })

      const invoice = await prisma.userInvoice.create({
        data: {
          schoolId,
          userId: adminUser.id,
          invoice_no: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
          invoice_date: invoiceDate,
          due_date: dueDate,
          currency: "SDG",
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          sub_total: installmentAmount,
          discount: 0,
          tax_percentage: 0,
          total: installmentAmount,
          notes: `Installment ${i + 1} of 3 for academic year`,
          status: i === 0 && assignment.status === "PARTIAL" ? "PAID" :
                  i === 1 && Math.random() < 0.5 ? "PAID" :
                  dueDate < new Date() ? "OVERDUE" : "UNPAID"
        }
      })

      // Create invoice items
      await prisma.userInvoiceItem.create({
        data: {
          schoolId,
          invoiceId: invoice.id,
          item_name: `Tuition Fee - Installment ${i + 1}`,
          quantity: 1,
          price: installmentAmount * 0.8,
          total: installmentAmount * 0.8
        }
      })

      await prisma.userInvoiceItem.create({
        data: {
          schoolId,
          invoiceId: invoice.id,
          item_name: "Other Fees",
          quantity: 1,
          price: installmentAmount * 0.2,
          total: installmentAmount * 0.2
        }
      })

      invoices.push(invoice)

      // Create payment if invoice is paid
      if (invoice.status === "PAID") {
        const payment = await prisma.payment.create({
          data: {
            schoolId,
            feeAssignmentId: assignment.id,
            studentId: student.id,
            paymentNumber: `PAY-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`,
            amount: installmentAmount,
            paymentDate: addDays(invoiceDate, Math.floor(Math.random() * 20)),
            paymentMethod: Math.random() < 0.7 ? "BANK_TRANSFER" : "CASH",
            transactionId: Math.random() < 0.7 ? `TXN-${Date.now()}` : null,
            bankName: Math.random() < 0.7 ? "Bank of Khartoum" : null,
            receiptNumber: `REC-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`,
            status: "SUCCESS",
            remarks: "Payment received successfully"
          }
        })
        payments.push(payment)
      }
    }
  }

  return { invoices, payments, receipts }
}

// Seed Bank Accounts
async function seedBankAccounts(schoolId: string) {
  // Get a user to associate with bank accounts
  const adminUser = await prisma.user.findFirst({
    where: { schoolId, role: "ADMIN" }
  })

  if (!adminUser) {
    console.log("⚠️ No admin user found for bank accounts")
    return []
  }

  const accounts = [
    {
      name: "Operating Account",
      bankId: "BANK001",
      accountId: "ACC" + Date.now() + "001",
      institutionId: "INS001",
      officialName: "Demo School Operating Account",
      mask: "****1234",
      currentBalance: 150000,
      availableBalance: 150000,
      type: "depository",
      subtype: "checking"
    },
    {
      name: "Savings Account",
      bankId: "BANK002",
      accountId: "ACC" + Date.now() + "002",
      institutionId: "INS002",
      officialName: "Demo School Savings Account",
      mask: "****5678",
      currentBalance: 30000,
      availableBalance: 30000,
      type: "depository",
      subtype: "savings"
    },
    {
      name: "Tuition Collection Account",
      bankId: "BANK003",
      accountId: "ACC" + Date.now() + "003",
      institutionId: "INS003",
      officialName: "Demo School Fee Collection Account",
      mask: "****9012",
      currentBalance: 180000,
      availableBalance: 180000,
      type: "depository",
      subtype: "checking"
    }
  ]

  const created = []
  for (const account of accounts) {
    const bankAccount = await prisma.bankAccount.create({
      data: {
        schoolId,
        userId: adminUser.id,
        ...account,
        accessToken: "encrypted_token_" + account.accountId
      }
    })
    created.push(bankAccount)
  }

  return created
}

// Seed Salary Structures
async function seedSalaryStructures(schoolId: string, teachers: any[]) {
  const structures = []

  for (const teacher of teachers) {
    const baseSalary = 18000 + Math.floor(Math.random() * 12000) // 18,000 - 30,000
    const structure = await prisma.salaryStructure.create({
      data: {
        schoolId,
        teacherId: teacher.id,
        effectiveFrom: subMonths(new Date(), 12),
        baseSalary,
        currency: "SDG",
        payFrequency: "MONTHLY",
        isActive: true,
        notes: "Annual salary structure"
      }
    })

    // Add allowances
    await prisma.salaryAllowance.create({
      data: {
        schoolId,
        structureId: structure.id,
        name: "Housing Allowance",
        amount: baseSalary * 0.2,
        isTaxable: true,
        isRecurring: true
      }
    })

    await prisma.salaryAllowance.create({
      data: {
        schoolId,
        structureId: structure.id,
        name: "Transport Allowance",
        amount: baseSalary * 0.1,
        isTaxable: false,
        isRecurring: true
      }
    })

    // Add deductions
    await prisma.salaryDeduction.create({
      data: {
        schoolId,
        structureId: structure.id,
        name: "Income Tax",
        amount: baseSalary * 0.05,
        type: "TAX",
        isRecurring: true
      }
    })

    await prisma.salaryDeduction.create({
      data: {
        schoolId,
        structureId: structure.id,
        name: "Social Security",
        amount: baseSalary * 0.02,
        type: "INSURANCE",
        isRecurring: true
      }
    })

    structures.push(structure)
  }

  return structures
}

// Seed Payroll Runs
async function seedPayrollRuns(
  schoolId: string,
  teachers: any[],
  salaryStructures: any[],
  fiscalYearId: string
) {
  const payrollRuns = []
  const currentDate = new Date()

  // Create payroll for the last 6 months
  for (let i = 5; i >= 0; i--) {
    const payDate = subMonths(currentDate, i)
    const payPeriodStart = startOfMonth(payDate)
    const payPeriodEnd = endOfMonth(payDate)

    const totalGross = salaryStructures.reduce((sum, s) => sum + Number(s.baseSalary) * 1.3, 0) // Include allowances
    const totalDeductions = totalGross * 0.07 // 7% deductions
    const totalNet = totalGross - totalDeductions

    const payrollRun = await prisma.payrollRun.create({
      data: {
        schoolId,
        runNumber: `PR-${format(payDate, 'yyyy-MM')}-001`,
        payPeriodStart,
        payPeriodEnd,
        payDate: endOfMonth(payDate),
        status: i < 2 ? "PAID" : i < 4 ? "APPROVED" : "PROCESSING",
        totalGross,
        totalDeductions,
        totalNet,
        processedBy: "System",
        processedAt: i < 2 ? payDate : null,
        approvedBy: i < 4 ? "Admin" : null,
        approvedAt: i < 4 ? subDays(payDate, 2) : null,
        notes: `Payroll for ${format(payDate, 'MMMM yyyy')}`
      }
    })

    // Create salary slips for each teacher
    for (const teacher of teachers) {
      const structure = salaryStructures.find(s => s.teacherId === teacher.id)
      if (!structure) continue

      const baseSalary = Number(structure.baseSalary)
      const allowances = baseSalary * 0.3
      const grossSalary = baseSalary + allowances
      const taxAmount = grossSalary * 0.05
      const insurance = grossSalary * 0.02
      const totalDeductions = taxAmount + insurance
      const netSalary = grossSalary - totalDeductions

      await prisma.salarySlip.create({
        data: {
          schoolId,
          payrollRunId: payrollRun.id,
          structureId: structure.id,
          teacherId: teacher.id,
          slipNumber: `SLIP-${format(payDate, 'yyyy-MM')}-${teacher.id.slice(-4)}`,
          payPeriodStart,
          payPeriodEnd,
          payDate: endOfMonth(payDate),
          baseSalary,
          allowances: [
            { name: "Housing Allowance", amount: baseSalary * 0.2, isTaxable: true },
            { name: "Transport Allowance", amount: baseSalary * 0.1, isTaxable: false }
          ],
          overtime: 0,
          bonus: 0,
          grossSalary,
          taxAmount,
          insurance,
          loanDeduction: 0,
          otherDeductions: [],
          totalDeductions,
          netSalary,
          daysWorked: 22,
          daysPresent: 21,
          daysAbsent: 1,
          hoursWorked: 176,
          overtimeHours: 0,
          status: i < 2 ? "PAID" : "GENERATED",
          paidAt: i < 2 ? payDate : null
        }
      })
    }

    payrollRuns.push(payrollRun)
  }

  return payrollRuns
}

// Seed Timesheets
async function seedTimesheets(schoolId: string, teachers: any[]) {
  const currentMonth = new Date()
  const periodStart = startOfMonth(currentMonth)
  const periodEnd = endOfMonth(currentMonth)

  // Create timesheet period
  const period = await prisma.timesheetPeriod.create({
    data: {
      schoolId,
      name: format(currentMonth, 'MMMM yyyy'),
      startDate: periodStart,
      endDate: periodEnd,
      status: "OPEN"
    }
  })

  // Create entries for each teacher
  for (const teacher of teachers) {
    // Create entries for each working day
    for (let day = 1; day <= 22; day++) {
      const entryDate = addDays(periodStart, day)
      if (entryDate.getDay() === 0 || entryDate.getDay() === 6) continue // Skip weekends

      await prisma.timesheetEntry.create({
        data: {
          schoolId,
          periodId: period.id,
          teacherId: teacher.id,
          entryDate,
          hoursWorked: 8,
          overtimeHours: Math.random() < 0.1 ? 2 : 0, // 10% chance of overtime
          leaveHours: 0,
          status: "APPROVED",
          submittedBy: teacher.id,
          submittedAt: entryDate,
          approvedBy: "Admin",
          approvedAt: addDays(entryDate, 1)
        }
      })
    }
  }
}

// Seed Budgets
async function seedBudgets(schoolId: string, fiscalYearId: string) {
  const budget = await prisma.budget.create({
    data: {
      schoolId,
      fiscalYearId,
      name: "Annual Operating Budget",
      description: "Budget for all departments and operations",
      totalAmount: 800000,
      status: "ACTIVE",
      approvedBy: "Board",
      approvedAt: subMonths(new Date(), 2),
      createdBy: "Admin"
    }
  })

  return [budget]
}

// Seed Expense Categories
async function seedExpenseCategories(schoolId: string, accounts: any[]) {
  const categories = [
    { name: "Salaries & Benefits", accountCode: "5000" },
    { name: "Utilities", accountCode: "5100" },
    { name: "Supplies & Materials", accountCode: "5200" },
    { name: "Maintenance & Repairs", accountCode: "5300" },
    { name: "Professional Services", accountCode: "5400" },
    { name: "Insurance", accountCode: "5500" },
    { name: "Other Expenses", accountCode: "5900" }
  ]

  const created = []
  for (const cat of categories) {
    const account = accounts.find(a => a.code === cat.accountCode)
    const category = await prisma.expenseCategory.create({
      data: {
        schoolId,
        name: cat.name,
        description: `Expenses related to ${cat.name.toLowerCase()}`,
        accountId: account?.id,
        isActive: true,
        requiresApproval: true
      }
    })
    created.push(category)
  }

  return created
}

// Seed Expenses
async function seedExpenses(
  schoolId: string,
  categories: any[],
  budgets: any[]
) {
  const expenses = []
  const expenseData = [
    { category: "Utilities", vendor: "Electric Company", amount: 5000, description: "Monthly electricity bill" },
    { category: "Utilities", vendor: "Water Department", amount: 1500, description: "Monthly water bill" },
    { category: "Supplies & Materials", vendor: "Office Depot", amount: 3000, description: "Office supplies purchase" },
    { category: "Maintenance & Repairs", vendor: "ABC Maintenance", amount: 2500, description: "AC system repair" },
    { category: "Professional Services", vendor: "Legal Associates", amount: 5000, description: "Legal consultation fees" },
    { category: "Insurance", vendor: "Insurance Corp", amount: 8000, description: "Monthly insurance premium" }
  ]

  for (let i = 0; i < 20; i++) {
    const data = expenseData[Math.floor(Math.random() * expenseData.length)]
    const category = categories.find(c => c.name.includes(data.category.split(" ")[0]))

    if (!category) continue

    const expense = await prisma.expense.create({
      data: {
        schoolId,
        expenseNumber: `EXP-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        categoryId: category.id,
        amount: data.amount + Math.floor(Math.random() * 1000),
        expenseDate: subDays(new Date(), Math.floor(Math.random() * 60)),
        vendor: data.vendor,
        description: data.description,
        paymentMethod: Math.random() < 0.7 ? "BANK_TRANSFER" : "CASH",
        budgetId: budgets[0]?.id,
        status: Math.random() < 0.7 ? "PAID" : Math.random() < 0.9 ? "APPROVED" : "PENDING",
        submittedBy: "Staff",
        submittedAt: subDays(new Date(), Math.floor(Math.random() * 60)),
        approvedBy: Math.random() < 0.7 ? "Admin" : null,
        approvedAt: Math.random() < 0.7 ? subDays(new Date(), Math.floor(Math.random() * 30)) : null,
        paidAt: Math.random() < 0.5 ? new Date() : null
      }
    })
    expenses.push(expense)

    // Update budget allocation
    if (budgets[0]) {
      const existingAllocation = await prisma.budgetAllocation.findUnique({
        where: {
          budgetId_categoryId: {
            budgetId: budgets[0].id,
            categoryId: category.id
          }
        }
      })

      if (existingAllocation) {
        await prisma.budgetAllocation.update({
          where: { id: existingAllocation.id },
          data: {
            spent: { increment: expense.amount },
            remaining: { decrement: expense.amount }
          }
        })
      } else {
        await prisma.budgetAllocation.create({
          data: {
            schoolId,
            budgetId: budgets[0].id,
            categoryId: category.id,
            allocated: 100000,
            spent: expense.amount,
            remaining: 100000 - Number(expense.amount)
          }
        })
      }
    }
  }

  return expenses
}

// Seed Wallets
async function seedWallets(schoolId: string, students: any[]) {
  const wallets = []

  // Create school wallet
  const schoolWallet = await prisma.wallet.create({
    data: {
      schoolId,
      walletType: "SCHOOL",
      ownerId: schoolId,
      balance: 50000,
      currency: "SDG",
      isActive: true
    }
  })
  wallets.push(schoolWallet)

  // Create some parent and student wallets
  for (let i = 0; i < Math.min(20, students.length); i++) {
    const student = students[i]

    // Student wallet
    const studentWallet = await prisma.wallet.create({
      data: {
        schoolId,
        walletType: "STUDENT",
        ownerId: student.id,
        balance: Math.floor(Math.random() * 500),
        currency: "SDG",
        isActive: true
      }
    })
    wallets.push(studentWallet)

    // Create some transactions
    if (Number(studentWallet.balance) > 0) {
      await prisma.walletTransaction.create({
        data: {
          schoolId,
          walletId: studentWallet.id,
          type: "CREDIT",
          amount: studentWallet.balance,
          balanceAfter: studentWallet.balance,
          description: "Initial wallet top-up",
          createdBy: "System"
        }
      })
    }
  }

  return wallets
}

// Seed Bank Transactions
async function seedBankTransactions(schoolId: string, bankAccounts: any[]) {
  const transactions = []

  for (const account of bankAccounts) {
    // Create 10-20 transactions per account
    const numTransactions = 10 + Math.floor(Math.random() * 10)

    for (let i = 0; i < numTransactions; i++) {
      const isCredit = Math.random() < 0.6 // 60% credits, 40% debits
      const amount = Math.floor(Math.random() * 10000) + 1000

      const transaction = await prisma.transaction.create({
        data: {
          schoolId,
          accountId: account.accountId,
          bankAccountId: account.id,
          name: isCredit ? "Payment Received" : "Expense Payment",
          amount,
          date: subDays(new Date(), Math.floor(Math.random() * 90)),
          paymentChannel: Math.random() < 0.7 ? "online" : "in_store",
          category: isCredit ? "Income" : "Expense",
          subcategory: isCredit ? "Tuition" : "Operations",
          type: isCredit ? "credit" : "debit",
          pending: false,
          merchantName: isCredit ? "Parent Payment" : "Vendor Payment",
          isoCurrencyCode: "SDG"
        }
      })
      transactions.push(transaction)
    }
  }

  return transactions
}

// Seed Financial Reports
async function seedFinancialReports(schoolId: string, fiscalYearId: string) {
  const reports = [
    {
      reportType: "PROFIT_LOSS" as const,
      reportName: "Profit & Loss Statement - Current Month",
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    },
    {
      reportType: "BALANCE_SHEET" as const,
      reportName: "Balance Sheet - Current",
      startDate: new Date(),
      endDate: new Date()
    },
    {
      reportType: "CASH_FLOW" as const,
      reportName: "Cash Flow Statement - YTD",
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date()
    },
    {
      reportType: "FEE_COLLECTION" as const,
      reportName: "Fee Collection Report - Current Month",
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    }
  ]

  const created = []
  for (const report of reports) {
    const financialReport = await prisma.financialReport.create({
      data: {
        schoolId,
        fiscalYearId,
        ...report,
        parameters: {
          includeDetails: true,
          groupBy: "category"
        },
        status: "COMPLETED",
        generatedBy: "System"
      }
    })
    created.push(financialReport)
  }

  return created
}

// Seed Finance Permissions
async function seedFinancePermissions(schoolId: string) {
  // Get some users to assign permissions to
  const users = await prisma.user.findMany({
    where: { schoolId },
    take: 5
  })

  const permissions = []
  const modules = ['invoice', 'banking', 'payroll', 'expenses', 'reports']
  const actions = ['view', 'create', 'edit', 'approve']

  for (const user of users) {
    // Give each user random permissions
    for (let i = 0; i < 3; i++) {
      const module = modules[Math.floor(Math.random() * modules.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]

      const existing = await prisma.financePermission.findUnique({
        where: {
          schoolId_userId_module_action: {
            schoolId,
            userId: user.id,
            module,
            action
          }
        }
      })

      if (!existing) {
        const permission = await prisma.financePermission.create({
          data: {
            schoolId,
            userId: user.id,
            module,
            action
          }
        })
        permissions.push(permission)
      }
    }
  }

  return permissions
}

// Export for use in main seed file
export default seedFinance