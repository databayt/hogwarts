/**
 * Finance Seed Module
 * Creates comprehensive financial data: accounts, payroll, banking, budgets, expenses
 */

import {
  AccountType,
  BalanceType,
  PayFrequency,
  DeductionType,
  PayrollStatus,
  SlipStatus,
  PeriodStatus,
  EntryStatus,
  WalletType,
  TransactionType,
  BudgetStatus,
  ExpenseStatus,
  FinancialReportType,
  FinancialReportStatus,
  ReconciliationStatus,
  InvoiceStatus,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import type { SeedPrisma, UserRef, TeacherRef, StudentRef } from "./types";

export async function seedFinance(
  prisma: SeedPrisma,
  schoolId: string,
  schoolName: string,
  users: UserRef[],
  teachers: TeacherRef[],
  students: StudentRef[]
): Promise<void> {
  console.log("💰 Creating finance module...");

  const adminUser = users.find(u => u.email.includes("admin"));
  const accountantUser = users.find(u => u.email.includes("accountant"));

  if (!adminUser || !accountantUser) {
    console.log("   ⚠️ Admin or accountant not found, skipping finance\n");
    return;
  }

  // ===== FISCAL YEAR =====
  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      schoolId,
      name: "FY 2025-2026",
      startDate: new Date("2025-07-01T00:00:00Z"),
      endDate: new Date("2026-06-30T23:59:59Z"),
      isCurrent: true,
      isClosed: false,
    },
  });

  // ===== CHART OF ACCOUNTS =====
  const accounts = [
    { code: "1000", name: "Cash", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT },
    { code: "1100", name: "Bank Account - Main", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT },
    { code: "1200", name: "Accounts Receivable", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT },
    { code: "2000", name: "Accounts Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT },
    { code: "2100", name: "Salaries Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT },
    { code: "3000", name: "Owner's Capital", type: AccountType.EQUITY, normalBalance: BalanceType.CREDIT },
    { code: "4000", name: "Tuition Revenue", type: AccountType.REVENUE, normalBalance: BalanceType.CREDIT },
    { code: "5000", name: "Salaries Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT },
    { code: "5100", name: "Utilities Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT },
    { code: "5200", name: "Office Supplies", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT },
  ];

  const createdAccounts = [];
  for (const acc of accounts) {
    const account = await prisma.chartOfAccount.create({
      data: { schoolId, ...acc, isActive: true },
    });
    createdAccounts.push(account);
  }

  // ===== EXPENSE CATEGORIES =====
  const expenseCategories = ["Personnel", "Facilities", "Academic", "Administration", "Financial"];
  const createdCategories = new Map<string, string>();

  for (const name of expenseCategories) {
    const cat = await prisma.expenseCategory.create({
      data: { schoolId, name, isActive: true, requiresApproval: true },
    });
    createdCategories.set(name, cat.id);
  }

  // ===== SALARY STRUCTURES (for 30 teachers) =====
  const salaryStructures: { id: string; baseSalary: number; teacher: TeacherRef }[] = [];

  for (const teacher of teachers.slice(0, 30)) {
    const baseSalary = faker.number.int({ min: 3000, max: 8000 });

    const structure = await prisma.salaryStructure.create({
      data: {
        schoolId,
        teacherId: teacher.id,
        effectiveFrom: new Date("2025-07-01T00:00:00Z"),
        baseSalary,
        currency: "USD",
        payFrequency: PayFrequency.MONTHLY,
        isActive: true,
      },
    });

    await prisma.salaryAllowance.createMany({
      data: [
        { schoolId, structureId: structure.id, name: "Housing Allowance", amount: baseSalary * 0.25, isTaxable: true, isRecurring: true },
        { schoolId, structureId: structure.id, name: "Transport Allowance", amount: baseSalary * 0.10, isTaxable: true, isRecurring: true },
      ],
    });

    await prisma.salaryDeduction.createMany({
      data: [
        { schoolId, structureId: structure.id, name: "Income Tax", amount: baseSalary * 0.15, type: DeductionType.TAX, isRecurring: true },
        { schoolId, structureId: structure.id, name: "Pension", amount: baseSalary * 0.08, type: DeductionType.PENSION, isRecurring: true },
      ],
    });

    salaryStructures.push({ id: structure.id, baseSalary, teacher });
  }

  // ===== TIMESHEET PERIODS (6 months) =====
  for (let month = 0; month < 6; month++) {
    const startDate = new Date(2025, 6 + month, 1);
    const endDate = new Date(2025, 7 + month, 0);

    const period = await prisma.timesheetPeriod.create({
      data: {
        schoolId,
        name: `${startDate.toLocaleString('default', { month: 'long' })} ${startDate.getFullYear()}`,
        startDate,
        endDate,
        status: month < 5 ? PeriodStatus.CLOSED : PeriodStatus.OPEN,
        closedBy: month < 5 ? accountantUser.id : null,
        closedAt: month < 5 ? new Date(2025, 7 + month, 5) : null,
      },
    });

    // Timesheet entries for first 10 teachers
    const entries = [];
    for (const { teacher } of salaryStructures.slice(0, 10)) {
      for (let day = 1; day <= 3; day++) {
        const entryDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
        if (entryDate <= new Date()) {
          entries.push({
            schoolId,
            periodId: period.id,
            teacherId: teacher.id,
            entryDate,
            hoursWorked: 8,
            overtimeHours: 0,
            leaveHours: 0,
            status: EntryStatus.APPROVED,
            submittedBy: teacher.id,
            submittedAt: new Date(entryDate.getTime() + 24 * 60 * 60 * 1000),
            approvedBy: adminUser.id,
            approvedAt: new Date(entryDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          });
        }
      }
    }

    if (entries.length > 0) {
      await prisma.timesheetEntry.createMany({ data: entries, skipDuplicates: true });
    }
  }

  // ===== PAYROLL RUNS (5 months) =====
  for (let month = 0; month < 5; month++) {
    const payPeriodStart = new Date(2025, 6 + month, 1);
    const payPeriodEnd = new Date(2025, 7 + month, 0);
    const payDate = new Date(2025, 7 + month, 1);

    const run = await prisma.payrollRun.create({
      data: {
        schoolId,
        runNumber: `PR-2025-${String(month + 1).padStart(3, "0")}`,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        status: PayrollStatus.PAID,
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        processedBy: accountantUser.id,
        processedAt: new Date(payDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        approvedBy: adminUser.id,
        approvedAt: new Date(payDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    let totalGross = 0, totalDeductions = 0, totalNet = 0;

    for (const { id: structureId, baseSalary, teacher } of salaryStructures) {
      const allowanceAmount = baseSalary * 0.35;
      const grossSalary = baseSalary + allowanceAmount;
      const taxAmount = baseSalary * 0.15;
      const pension = baseSalary * 0.08;
      const deductions = taxAmount + pension;
      const netSalary = grossSalary - deductions;

      await prisma.salarySlip.create({
        data: {
          schoolId,
          payrollRunId: run.id,
          structureId,
          teacherId: teacher.id,
          slipNumber: `SLP-${run.runNumber}-${teacher.id.substring(0, 6)}`,
          payPeriodStart,
          payPeriodEnd,
          payDate,
          baseSalary,
          allowances: [{ name: "Housing", amount: baseSalary * 0.25 }, { name: "Transport", amount: baseSalary * 0.10 }],
          overtime: 0,
          bonus: 0,
          grossSalary,
          taxAmount,
          insurance: 0,
          loanDeduction: 0,
          otherDeductions: [],
          totalDeductions: deductions,
          netSalary,
          daysWorked: 22,
          daysPresent: 22,
          daysAbsent: 0,
          hoursWorked: 176,
          status: SlipStatus.PAID,
          paidAt: payDate,
        },
      });

      totalGross += grossSalary;
      totalDeductions += deductions;
      totalNet += netSalary;
    }

    await prisma.payrollRun.update({
      where: { id: run.id },
      data: { totalGross, totalDeductions, totalNet },
    });
  }

  // ===== BANK ACCOUNTS =====
  const mainBank = await prisma.bankAccount.create({
    data: {
      schoolId,
      userId: adminUser.id,
      bankId: "bank_main",
      accountId: `ACC-${faker.finance.accountNumber(10)}`,
      accessToken: "encrypted_token",
      institutionId: "inst_001",
      name: "Main Operating Account",
      officialName: `${schoolName} Operating`,
      mask: "1234",
      currentBalance: 500000,
      availableBalance: 480000,
      type: "depository",
      subtype: "checking",
    },
  });

  // Bank transactions (50)
  for (let i = 0; i < 50; i++) {
    const isCredit = i % 3 === 0;
    const amount = faker.number.float({ min: 100, max: 5000, multipleOf: 0.01 });

    await prisma.transaction.create({
      data: {
        schoolId,
        accountId: mainBank.accountId,
        bankAccountId: mainBank.id,
        name: isCredit ? "Fee Payment" : "Expense Payment",
        amount: isCredit ? amount : -amount,
        date: faker.date.between({ from: "2025-07-01", to: new Date() }),
        paymentChannel: "online",
        category: isCredit ? "Income" : "Expense",
        type: isCredit ? "credit" : "debit",
        pending: false,
        isoCurrencyCode: "USD",
      },
    });
  }

  // ===== WALLET =====
  const wallet = await prisma.wallet.create({
    data: {
      schoolId,
      walletType: WalletType.SCHOOL,
      ownerId: schoolId,
      balance: 50000,
      currency: "USD",
      isActive: true,
    },
  });

  for (let i = 0; i < 10; i++) {
    const type = i % 2 === 0 ? TransactionType.CREDIT : TransactionType.DEBIT;
    const amount = faker.number.float({ min: 100, max: 2000, multipleOf: 0.01 });

    await prisma.walletTransaction.create({
      data: {
        schoolId,
        walletId: wallet.id,
        type,
        amount,
        balanceAfter: 50000 + (type === TransactionType.CREDIT ? amount : -amount),
        description: type === TransactionType.CREDIT ? "Payment received" : "Refund processed",
        sourceModule: "fees",
        createdBy: accountantUser.id,
      },
    });
  }

  // ===== BUDGETS =====
  for (let i = 0; i < 3; i++) {
    const budget = await prisma.budget.create({
      data: {
        schoolId,
        fiscalYearId: fiscalYear.id,
        name: `Budget ${i + 1} - FY 2025-2026`,
        description: `Department budget ${i + 1}`,
        totalAmount: faker.number.int({ min: 50000, max: 200000 }),
        status: BudgetStatus.ACTIVE,
        approvedBy: adminUser.id,
        approvedAt: new Date("2025-07-01"),
        createdBy: accountantUser.id,
      },
    });

    const categoryId = Array.from(createdCategories.values())[i % createdCategories.size];
    const allocated = faker.number.float({ min: 5000, max: 30000, multipleOf: 0.01 });
    const spent = faker.number.float({ min: 0, max: allocated * 0.7, multipleOf: 0.01 });

    await prisma.budgetAllocation.create({
      data: {
        schoolId,
        budgetId: budget.id,
        categoryId,
        allocated,
        spent,
        remaining: allocated - spent,
      },
    });
  }

  // ===== EXPENSES (30) =====
  const categoryIds = Array.from(createdCategories.values());
  for (let i = 0; i < 30; i++) {
    await prisma.expense.create({
      data: {
        schoolId,
        expenseNumber: `EXP-2025-${String(i + 1).padStart(4, "0")}`,
        categoryId: categoryIds[i % categoryIds.length],
        amount: faker.number.float({ min: 50, max: 2000, multipleOf: 0.01 }),
        expenseDate: faker.date.between({ from: "2025-07-01", to: new Date() }),
        vendor: faker.company.name(),
        description: "Operating expense",
        paymentMethod: ["Cash", "Bank Transfer", "Credit Card"][i % 3],
        status: i < 20 ? ExpenseStatus.PAID : ExpenseStatus.APPROVED,
        submittedBy: accountantUser.id,
        submittedAt: faker.date.between({ from: "2025-07-01", to: new Date() }),
        approvedBy: adminUser.id,
        approvedAt: faker.date.between({ from: "2025-07-01", to: new Date() }),
        paidAt: i < 20 ? faker.date.between({ from: "2025-07-01", to: new Date() }) : null,
      },
    });
  }

  // ===== USER INVOICES (20) =====
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const invoiceDate = faker.date.between({ from: "2025-07-01", to: new Date() });
    const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const isPaid = i < 12;

    const fromAddress = await prisma.userInvoiceAddress.create({
      data: {
        schoolId,
        name: schoolName,
        email: `billing@${schoolName.toLowerCase().replace(/\s+/g, "")}.org`,
        address1: "123 School Street",
      },
    });

    const toAddress = await prisma.userInvoiceAddress.create({
      data: {
        schoolId,
        name: faker.person.fullName(),
        email: user.email,
        address1: faker.location.streetAddress(),
      },
    });

    const subTotal = faker.number.float({ min: 500, max: 3000, multipleOf: 0.01 });
    const tax = subTotal * 0.1;
    const total = subTotal + tax;

    const invoice = await prisma.userInvoice.create({
      data: {
        schoolId,
        userId: user.id,
        invoice_no: `INV-2025-${String(i + 1).padStart(4, "0")}`,
        invoice_date: invoiceDate,
        due_date: dueDate,
        currency: "USD",
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        sub_total: subTotal,
        tax_percentage: 10,
        total,
        status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
      },
    });

    await prisma.userInvoiceItem.create({
      data: {
        schoolId,
        invoiceId: invoice.id,
        item_name: "Tuition Fee",
        quantity: 1,
        price: subTotal,
        total: subTotal,
      },
    });
  }

  // ===== FINANCIAL REPORTS =====
  const reportTypes = [FinancialReportType.PROFIT_LOSS, FinancialReportType.BALANCE_SHEET, FinancialReportType.CASH_FLOW];

  for (const reportType of reportTypes) {
    await prisma.financialReport.create({
      data: {
        schoolId,
        reportType,
        reportName: `${reportType.replace(/_/g, " ")} Report`,
        fiscalYearId: fiscalYear.id,
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-12-31"),
        status: FinancialReportStatus.COMPLETED,
        generatedBy: accountantUser.id,
        fileUrl: `/reports/${reportType.toLowerCase()}.pdf`,
      },
    });
  }

  console.log(`   ✅ Created: Chart of accounts, Payroll (5 months), Banking, Budgets, Expenses, Invoices\n`);
}
