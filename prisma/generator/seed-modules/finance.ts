/*
  Finance Module Seed - Comprehensive Financial Management
  Coverage: Accounting, Invoicing, Banking, Payroll, Expenses, Budgets

  This module seeds all finance-related data for a complete demo:
  - Chart of Accounts (50+ accounts)
  - Fiscal Year with journal entries
  - User invoices (50+) with line items
  - Bank accounts and transactions (200+)
  - Payroll structures and runs (12 months)
  - Salary slips for all teachers
  - Timesheet entries
  - Wallet system with transactions
  - Budgets with allocations
  - Expense categories and expenses (100+)
  - Financial reports
*/

import { PrismaClient, AccountType, BalanceType, InvoiceStatus, PaymentStatus, PayFrequency, DeductionType, PayrollStatus, SlipStatus, PeriodStatus, EntryStatus, WalletType, TransactionType, BudgetStatus, ExpenseStatus, FinancialReportType, FinancialReportStatus, ReconciliationStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

type FinanceSeedData = {
  school: { id: string; name: string };
  users: Array<{ id: string; email: string; role: string }>;
  teachers: Array<{ id: string; emailAddress: string }>;
  students: Array<{ id: string }>;
};

export async function seedFinanceModule(prisma: PrismaClient, data: FinanceSeedData) {
  console.log("\n💰 Seeding Finance Module...");

  const { school, users, teachers, students } = data;
  const adminUser = users.find(u => u.email.includes("admin"));
  const accountantUser = users.find(u => u.email.includes("accountant"));

  if (!adminUser || !accountantUser) {
    console.log("⚠️  Admin or accountant user not found, skipping finance seed");
    return;
  }

  // ===== 1. FISCAL YEAR =====
  console.log("  📅 Creating fiscal year...");
  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "FY 2025-2026" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "FY 2025-2026",
      startDate: new Date("2025-07-01T00:00:00Z"),
      endDate: new Date("2026-06-30T23:59:59Z"),
      isCurrent: true,
      isClosed: false,
    },
  });

  // ===== 2. CHART OF ACCOUNTS =====
  console.log("  🏦 Creating chart of accounts (50+ accounts)...");

  const accounts = [
    // ASSETS (1000-1999)
    { code: "1000", name: "Cash", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1010", name: "Petty Cash", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1100", name: "Bank Account - Main", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1110", name: "Bank Account - Payroll", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1120", name: "Bank Account - Savings", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1200", name: "Accounts Receivable - Fees", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1210", name: "Accounts Receivable - Other", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1300", name: "Prepaid Expenses", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1310", name: "Prepaid Insurance", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1320", name: "Prepaid Rent", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1400", name: "Inventory - Books", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1410", name: "Inventory - Supplies", type: AccountType.ASSET, subtype: "Current Asset", normalBalance: BalanceType.DEBIT },
    { code: "1500", name: "Land", type: AccountType.ASSET, subtype: "Fixed Asset", normalBalance: BalanceType.DEBIT },
    { code: "1510", name: "Building", type: AccountType.ASSET, subtype: "Fixed Asset", normalBalance: BalanceType.DEBIT },
    { code: "1520", name: "Furniture & Fixtures", type: AccountType.ASSET, subtype: "Fixed Asset", normalBalance: BalanceType.DEBIT },
    { code: "1530", name: "Equipment", type: AccountType.ASSET, subtype: "Fixed Asset", normalBalance: BalanceType.DEBIT },
    { code: "1540", name: "Computers & Technology", type: AccountType.ASSET, subtype: "Fixed Asset", normalBalance: BalanceType.DEBIT },
    { code: "1550", name: "Vehicles", type: AccountType.ASSET, subtype: "Fixed Asset", normalBalance: BalanceType.DEBIT },
    { code: "1560", name: "Accumulated Depreciation", type: AccountType.ASSET, subtype: "Fixed Asset", normalBalance: BalanceType.CREDIT },

    // LIABILITIES (2000-2999)
    { code: "2000", name: "Accounts Payable", type: AccountType.LIABILITY, subtype: "Current Liability", normalBalance: BalanceType.CREDIT },
    { code: "2100", name: "Salaries Payable", type: AccountType.LIABILITY, subtype: "Current Liability", normalBalance: BalanceType.CREDIT },
    { code: "2110", name: "Tax Payable - Income Tax", type: AccountType.LIABILITY, subtype: "Current Liability", normalBalance: BalanceType.CREDIT },
    { code: "2120", name: "Tax Payable - VAT/Sales Tax", type: AccountType.LIABILITY, subtype: "Current Liability", normalBalance: BalanceType.CREDIT },
    { code: "2130", name: "Insurance Payable", type: AccountType.LIABILITY, subtype: "Current Liability", normalBalance: BalanceType.CREDIT },
    { code: "2140", name: "Pension Payable", type: AccountType.LIABILITY, subtype: "Current Liability", normalBalance: BalanceType.CREDIT },
    { code: "2200", name: "Unearned Revenue - Advance Fees", type: AccountType.LIABILITY, subtype: "Current Liability", normalBalance: BalanceType.CREDIT },
    { code: "2300", name: "Short-term Loans", type: AccountType.LIABILITY, subtype: "Current Liability", normalBalance: BalanceType.CREDIT },
    { code: "2400", name: "Long-term Loans", type: AccountType.LIABILITY, subtype: "Long-term Liability", normalBalance: BalanceType.CREDIT },
    { code: "2410", name: "Mortgage Payable", type: AccountType.LIABILITY, subtype: "Long-term Liability", normalBalance: BalanceType.CREDIT },

    // EQUITY (3000-3999)
    { code: "3000", name: "Owner's Capital", type: AccountType.EQUITY, subtype: "Equity", normalBalance: BalanceType.CREDIT },
    { code: "3100", name: "Retained Earnings", type: AccountType.EQUITY, subtype: "Equity", normalBalance: BalanceType.CREDIT },
    { code: "3200", name: "Drawings", type: AccountType.EQUITY, subtype: "Equity", normalBalance: BalanceType.DEBIT },

    // REVENUE (4000-4999)
    { code: "4000", name: "Tuition Fee Revenue", type: AccountType.REVENUE, subtype: "Operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4010", name: "Admission Fee Revenue", type: AccountType.REVENUE, subtype: "Operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4020", name: "Registration Fee Revenue", type: AccountType.REVENUE, subtype: "Operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4030", name: "Exam Fee Revenue", type: AccountType.REVENUE, subtype: "Operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4040", name: "Library Fee Revenue", type: AccountType.REVENUE, subtype: "Operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4050", name: "Laboratory Fee Revenue", type: AccountType.REVENUE, subtype: "Operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4060", name: "Sports Fee Revenue", type: AccountType.REVENUE, subtype: "Operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4070", name: "Transport Fee Revenue", type: AccountType.REVENUE, subtype: "Operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4100", name: "Donation Revenue", type: AccountType.REVENUE, subtype: "Non-operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4110", name: "Grant Revenue", type: AccountType.REVENUE, subtype: "Non-operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4120", name: "Interest Income", type: AccountType.REVENUE, subtype: "Non-operating Revenue", normalBalance: BalanceType.CREDIT },
    { code: "4130", name: "Other Income", type: AccountType.REVENUE, subtype: "Non-operating Revenue", normalBalance: BalanceType.CREDIT },

    // EXPENSES (5000-5999)
    { code: "5000", name: "Salaries - Teaching Staff", type: AccountType.EXPENSE, subtype: "Personnel Expense", normalBalance: BalanceType.DEBIT },
    { code: "5010", name: "Salaries - Administrative Staff", type: AccountType.EXPENSE, subtype: "Personnel Expense", normalBalance: BalanceType.DEBIT },
    { code: "5020", name: "Salaries - Support Staff", type: AccountType.EXPENSE, subtype: "Personnel Expense", normalBalance: BalanceType.DEBIT },
    { code: "5100", name: "Employee Benefits", type: AccountType.EXPENSE, subtype: "Personnel Expense", normalBalance: BalanceType.DEBIT },
    { code: "5110", name: "Health Insurance", type: AccountType.EXPENSE, subtype: "Personnel Expense", normalBalance: BalanceType.DEBIT },
    { code: "5120", name: "Pension Contribution", type: AccountType.EXPENSE, subtype: "Personnel Expense", normalBalance: BalanceType.DEBIT },
    { code: "5200", name: "Rent Expense", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5210", name: "Utilities - Electricity", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5220", name: "Utilities - Water", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5230", name: "Utilities - Internet", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5300", name: "Office Supplies", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5310", name: "Teaching Materials", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5320", name: "Books & Publications", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5400", name: "Maintenance & Repairs", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5410", name: "Cleaning Services", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5420", name: "Security Services", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5500", name: "Marketing & Advertising", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5510", name: "Website & IT Services", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5520", name: "Software Subscriptions", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5600", name: "Travel & Transportation", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5610", name: "Professional Development", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5620", name: "Professional Fees - Legal", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5630", name: "Professional Fees - Accounting", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5700", name: "Insurance Expense", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5800", name: "Depreciation Expense", type: AccountType.EXPENSE, subtype: "Operating Expense", normalBalance: BalanceType.DEBIT },
    { code: "5900", name: "Bank Fees & Charges", type: AccountType.EXPENSE, subtype: "Financial Expense", normalBalance: BalanceType.DEBIT },
    { code: "5910", name: "Interest Expense", type: AccountType.EXPENSE, subtype: "Financial Expense", normalBalance: BalanceType.DEBIT },
    { code: "5920", name: "Bad Debt Expense", type: AccountType.EXPENSE, subtype: "Financial Expense", normalBalance: BalanceType.DEBIT },
  ];

  const createdAccounts = [];
  for (const acc of accounts) {
    const account = await prisma.chartOfAccount.upsert({
      where: { schoolId_code: { schoolId: school.id, code: acc.code } },
      update: {},
      create: {
        schoolId: school.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype || undefined,
        normalBalance: acc.normalBalance,
        isActive: true,
      },
    });
    createdAccounts.push(account);
  }

  console.log(`  ✅ Created ${createdAccounts.length} chart of accounts`);

  // ===== 3. EXPENSE CATEGORIES =====
  console.log("  📂 Creating expense categories...");

  const expenseCategories = [
    { name: "Personnel", parentName: null, accountCode: "5000" },
    { name: "Teaching Staff Salaries", parentName: "Personnel", accountCode: "5000" },
    { name: "Administrative Salaries", parentName: "Personnel", accountCode: "5010" },
    { name: "Support Staff Salaries", parentName: "Personnel", accountCode: "5020" },
    { name: "Employee Benefits", parentName: "Personnel", accountCode: "5100" },

    { name: "Facilities", parentName: null, accountCode: "5200" },
    { name: "Rent", parentName: "Facilities", accountCode: "5200" },
    { name: "Utilities", parentName: "Facilities", accountCode: "5210" },
    { name: "Maintenance", parentName: "Facilities", accountCode: "5400" },
    { name: "Cleaning", parentName: "Facilities", accountCode: "5410" },
    { name: "Security", parentName: "Facilities", accountCode: "5420" },

    { name: "Academic", parentName: null, accountCode: "5300" },
    { name: "Teaching Materials", parentName: "Academic", accountCode: "5310" },
    { name: "Books & Library", parentName: "Academic", accountCode: "5320" },
    { name: "Laboratory Equipment", parentName: "Academic", accountCode: "5300" },
    { name: "Sports Equipment", parentName: "Academic", accountCode: "5300" },

    { name: "Administration", parentName: null, accountCode: "5500" },
    { name: "Office Supplies", parentName: "Administration", accountCode: "5300" },
    { name: "Marketing", parentName: "Administration", accountCode: "5500" },
    { name: "IT Services", parentName: "Administration", accountCode: "5510" },
    { name: "Software", parentName: "Administration", accountCode: "5520" },

    { name: "Professional Services", parentName: null, accountCode: "5600" },
    { name: "Legal Fees", parentName: "Professional Services", accountCode: "5620" },
    { name: "Accounting Fees", parentName: "Professional Services", accountCode: "5630" },
    { name: "Consulting", parentName: "Professional Services", accountCode: "5600" },

    { name: "Travel & Development", parentName: null, accountCode: "5600" },
    { name: "Travel", parentName: "Travel & Development", accountCode: "5600" },
    { name: "Professional Development", parentName: "Travel & Development", accountCode: "5610" },
    { name: "Training", parentName: "Travel & Development", accountCode: "5610" },

    { name: "Financial", parentName: null, accountCode: "5900" },
    { name: "Bank Fees", parentName: "Financial", accountCode: "5900" },
    { name: "Interest", parentName: "Financial", accountCode: "5910" },
    { name: "Insurance", parentName: "Financial", accountCode: "5700" },
  ];

  const createdExpenseCategories = new Map<string, { id: string; name: string }>();

  // Create parent categories first
  for (const cat of expenseCategories.filter(c => !c.parentName)) {
    const account = createdAccounts.find(a => a.code === cat.accountCode);
    const category = await prisma.expenseCategory.upsert({
      where: { schoolId_name: { schoolId: school.id, name: cat.name } },
      update: {},
      create: {
        schoolId: school.id,
        name: cat.name,
        accountId: account?.id,
        isActive: true,
        requiresApproval: true,
      },
    });
    createdExpenseCategories.set(cat.name, category);
  }

  // Then create child categories
  for (const cat of expenseCategories.filter(c => c.parentName)) {
    const account = createdAccounts.find(a => a.code === cat.accountCode);
    const parent = createdExpenseCategories.get(cat.parentName!);
    const category = await prisma.expenseCategory.upsert({
      where: { schoolId_name: { schoolId: school.id, name: cat.name } },
      update: {},
      create: {
        schoolId: school.id,
        name: cat.name,
        accountId: account?.id,
        parentId: parent?.id,
        isActive: true,
        requiresApproval: true,
      },
    });
    createdExpenseCategories.set(cat.name, category);
  }

  console.log(`  ✅ Created ${createdExpenseCategories.size} expense categories`);

  // ===== 4. SALARY STRUCTURES & PAYROLL =====
  console.log("  💵 Creating salary structures for teachers...");

  const salaryStructures = [];
  for (const teacher of teachers.slice(0, 50)) { // Up to 50 teachers
    const baseSalary = faker.number.int({ min: 3000, max: 8000 });

    const structure = await prisma.salaryStructure.create({
      data: {
        schoolId: school.id,
        teacherId: teacher.id,
        effectiveFrom: new Date("2025-07-01T00:00:00Z"),
        baseSalary,
        currency: "USD",
        payFrequency: PayFrequency.MONTHLY,
        isActive: true,
      },
    });

    // Add allowances
    await prisma.salaryAllowance.createMany({
      data: [
        {
          schoolId: school.id,
          structureId: structure.id,
          name: "Housing Allowance",
          amount: baseSalary * 0.25, // 25% of base
          isTaxable: true,
          isRecurring: true,
        },
        {
          schoolId: school.id,
          structureId: structure.id,
          name: "Transport Allowance",
          amount: baseSalary * 0.10, // 10% of base
          isTaxable: true,
          isRecurring: true,
        },
        {
          schoolId: school.id,
          structureId: structure.id,
          name: "Medical Allowance",
          amount: baseSalary * 0.05, // 5% of base
          isTaxable: false,
          isRecurring: true,
        },
      ],
    });

    // Add deductions
    await prisma.salaryDeduction.createMany({
      data: [
        {
          schoolId: school.id,
          structureId: structure.id,
          name: "Income Tax",
          amount: baseSalary * 0.15, // 15% tax
          type: DeductionType.TAX,
          isRecurring: true,
        },
        {
          schoolId: school.id,
          structureId: structure.id,
          name: "Health Insurance",
          amount: 150,
          type: DeductionType.INSURANCE,
          isRecurring: true,
        },
        {
          schoolId: school.id,
          structureId: structure.id,
          name: "Pension Fund",
          amount: baseSalary * 0.08, // 8% pension
          type: DeductionType.PENSION,
          isRecurring: true,
        },
      ],
    });

    salaryStructures.push({ ...structure, baseSalary, teacher });
  }

  console.log(`  ✅ Created ${salaryStructures.length} salary structures with allowances and deductions`);

  // ===== 5. TIMESHEET PERIODS & ENTRIES =====
  console.log("  ⏱️  Creating timesheet periods and entries...");

  const timesheetPeriods = [];
  for (let month = 0; month < 12; month++) {
    const startDate = new Date(2025, 6 + month, 1); // July 2025 onwards
    const endDate = new Date(2025, 7 + month, 0); // Last day of month

    const period = await prisma.timesheetPeriod.create({
      data: {
        schoolId: school.id,
        name: `${startDate.toLocaleString('default', { month: 'long' })} ${startDate.getFullYear()}`,
        startDate,
        endDate,
        status: month < 10 ? PeriodStatus.CLOSED : PeriodStatus.OPEN,
        closedBy: month < 10 ? accountantUser.id : null,
        closedAt: month < 10 ? new Date(2025, 7 + month, 5) : null,
      },
    });

    timesheetPeriods.push(period);

    // Create timesheet entries for each teacher in the period (sample 5 days)
    const entriesToCreate = [];
    for (const {teacher} of salaryStructures.slice(0, 30)) { // Sample 30 teachers
      for (let day = 1; day <= 5; day++) {
        const entryDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
        if (entryDate <= new Date()) {
          entriesToCreate.push({
            schoolId: school.id,
            periodId: period.id,
            teacherId: teacher.id,
            entryDate,
            hoursWorked: 8,
            overtimeHours: Math.random() > 0.8 ? 2 : 0,
            leaveHours: 0,
            status: EntryStatus.APPROVED,
            submittedBy: teacher.id,
            submittedAt: new Date(entryDate.getTime() + 24 * 60 * 60 * 1000), // Next day
            approvedBy: adminUser.id,
            approvedAt: new Date(entryDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
          });
        }
      }
    }

    if (entriesToCreate.length > 0) {
      await prisma.timesheetEntry.createMany({
        data: entriesToCreate,
        skipDuplicates: true,
      });
    }
  }

  console.log(`  ✅ Created ${timesheetPeriods.length} timesheet periods with entries`);

  // ===== 6. PAYROLL RUNS & SALARY SLIPS =====
  console.log("  📊 Creating payroll runs and salary slips (12 months)...");

  const payrollRuns = [];
  for (let month = 0; month < 10; month++) { // 10 months of completed payroll
    const payPeriodStart = new Date(2025, 6 + month, 1);
    const payPeriodEnd = new Date(2025, 7 + month, 0);
    const payDate = new Date(2025, 7 + month, 1); // 1st of next month

    const run = await prisma.payrollRun.create({
      data: {
        schoolId: school.id,
        runNumber: `PR-2025-${String(month + 1).padStart(3, "0")}`,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        status: PayrollStatus.PAID,
        totalGross: 0, // Will calculate
        totalDeductions: 0,
        totalNet: 0,
        processedBy: accountantUser.id,
        processedAt: new Date(payDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days before payDate
        approvedBy: adminUser.id,
        approvedAt: new Date(payDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before payDate
      },
    });

    let runTotalGross = 0;
    let runTotalDeductions = 0;
    let runTotalNet = 0;

    // Create salary slips for each teacher
    for (const structureData of salaryStructures) {
      const { id: structureId, baseSalary, teacher } = structureData;

      const allowanceAmount = baseSalary * 0.40; // Total allowances (25% + 10% + 5%)
      const grossSalary = parseFloat(baseSalary.toString()) + allowanceAmount;
      const taxAmount = baseSalary * 0.15;
      const insurance = 150;
      const pension = baseSalary * 0.08;
      const totalDeductions = taxAmount + insurance + pension;
      const netSalary = grossSalary - totalDeductions;

      await prisma.salarySlip.create({
        data: {
          schoolId: school.id,
          payrollRunId: run.id,
          structureId,
          teacherId: teacher.id,
          slipNumber: `SLP-${run.runNumber}-${teacher.id.substring(0, 6)}`,
          payPeriodStart,
          payPeriodEnd,
          payDate,
          baseSalary,
          allowances: [
            { name: "Housing Allowance", amount: baseSalary * 0.25, isTaxable: true },
            { name: "Transport Allowance", amount: baseSalary * 0.10, isTaxable: true },
            { name: "Medical Allowance", amount: baseSalary * 0.05, isTaxable: false },
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
          daysPresent: Math.random() > 0.1 ? 22 : 21,
          daysAbsent: Math.random() > 0.1 ? 0 : 1,
          hoursWorked: 176, // 22 days * 8 hours
          status: SlipStatus.PAID,
          paidAt: payDate,
        },
      });

      runTotalGross += grossSalary;
      runTotalDeductions += totalDeductions;
      runTotalNet += netSalary;
    }

    // Update payroll run totals
    await prisma.payrollRun.update({
      where: { id: run.id },
      data: {
        totalGross: runTotalGross,
        totalDeductions: runTotalDeductions,
        totalNet: runTotalNet,
      },
    });

    payrollRuns.push(run);
  }

  console.log(`  ✅ Created ${payrollRuns.length} payroll runs with ${salaryStructures.length * payrollRuns.length} salary slips`);

  // ===== 7. USER INVOICES =====
  console.log("  🧾 Creating user invoices (50+)...");

  const invoices = [];
  for (let i = 0; i < 50; i++) {
    const user = users[i % users.length];
    const invoiceDate = faker.date.between({ from: "2025-07-01", to: new Date() });
    const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later
    const isPaid = Math.random() > 0.3;
    const isOverdue = !isPaid && dueDate < new Date();

    // Create addresses
    const fromAddress = await prisma.userInvoiceAddress.create({
      data: {
        schoolId: school.id,
        name: school.name,
        email: "billing@" + school.name.toLowerCase().replace(/\s+/g, "") + ".org",
        address1: "123 School Street",
        address2: "Education District",
      },
    });

    const toAddress = await prisma.userInvoiceAddress.create({
      data: {
        schoolId: school.id,
        name: faker.person.fullName(),
        email: user.email,
        address1: faker.location.streetAddress(),
        address2: faker.location.city(),
      },
    });

    // Create invoice
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items = [];
    let subTotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const price = faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 });
      const quantity = faker.number.int({ min: 1, max: 3 });
      const total = price * quantity;
      items.push({
        item_name: faker.commerce.productName(),
        quantity,
        price,
        total,
      });
      subTotal += total;
    }

    const discount = Math.random() > 0.7 ? subTotal * 0.1 : 0; // 10% discount for 30% of invoices
    const taxPercentage = 10; // 10% tax
    const total = subTotal - discount + (subTotal - discount) * (taxPercentage / 100);

    const invoice = await prisma.userInvoice.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        invoice_no: `INV-2025-${String(i + 1).padStart(4, "0")}`,
        invoice_date: invoiceDate,
        due_date: dueDate,
        currency: "USD",
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        sub_total: subTotal,
        discount: discount || null,
        tax_percentage: taxPercentage,
        total,
        status: isOverdue ? InvoiceStatus.OVERDUE : isPaid ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
        notes: "Thank you for your business!",
      },
    });

    // Create invoice items
    for (const item of items) {
      await prisma.userInvoiceItem.create({
        data: {
          schoolId: school.id,
          invoiceId: invoice.id,
          item_name: item.item_name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        },
      });
    }

    invoices.push(invoice);
  }

  console.log(`  ✅ Created ${invoices.length} user invoices with line items`);

  // ===== 8. BANK ACCOUNTS & TRANSACTIONS =====
  console.log("  🏦 Creating bank accounts and transactions (200+)...");

  // Create 3 bank accounts
  const mainBankAccount = await prisma.bankAccount.create({
    data: {
      schoolId: school.id,
      userId: adminUser.id,
      bankId: "bank_main_001",
      accountId: `ACC-${faker.finance.accountNumber(10)}`,
      accessToken: "encrypted_token_main",
      institutionId: "inst_001",
      name: "Main Operating Account",
      officialName: `${school.name} Operating`,
      mask: "1234",
      currentBalance: 500000,
      availableBalance: 480000,
      type: "depository",
      subtype: "checking",
    },
  });

  const payrollBankAccount = await prisma.bankAccount.create({
    data: {
      schoolId: school.id,
      userId: adminUser.id,
      bankId: "bank_payroll_002",
      accountId: `ACC-${faker.finance.accountNumber(10)}`,
      accessToken: "encrypted_token_payroll",
      institutionId: "inst_001",
      name: "Payroll Account",
      officialName: `${school.name} Payroll`,
      mask: "5678",
      currentBalance: 150000,
      availableBalance: 150000,
      type: "depository",
      subtype: "checking",
    },
  });

  const savingsBankAccount = await prisma.bankAccount.create({
    data: {
      schoolId: school.id,
      userId: adminUser.id,
      bankId: "bank_savings_003",
      accountId: `ACC-${faker.finance.accountNumber(10)}`,
      accessToken: "encrypted_token_savings",
      institutionId: "inst_001",
      name: "Savings Account",
      officialName: `${school.name} Savings`,
      mask: "9012",
      currentBalance: 200000,
      availableBalance: 200000,
      type: "depository",
      subtype: "savings",
    },
  });

  // Create 200+ transactions across all accounts
  const transactionTypes = [
    { category: "Income", subcategory: "Tuition Fees", type: "credit" },
    { category: "Income", subcategory: "Admission Fees", type: "credit" },
    { category: "Transfer", subcategory: "Internal Transfer", type: "debit" },
    { category: "Payroll", subcategory: "Salary Payment", type: "debit" },
    { category: "Utilities", subcategory: "Electricity Bill", type: "debit" },
    { category: "Utilities", subcategory: "Water Bill", type: "debit" },
    { category: "Utilities", subcategory: "Internet", type: "debit" },
    { category: "Supplies", subcategory: "Office Supplies", type: "debit" },
    { category: "Supplies", subcategory: "Teaching Materials", type: "debit" },
    { category: "Maintenance", subcategory: "Building Repairs", type: "debit" },
    { category: "Services", subcategory: "Cleaning Services", type: "debit" },
    { category: "Services", subcategory: "Security Services", type: "debit" },
  ];

  const transactions = [];
  const bankAccounts = [mainBankAccount, payrollBankAccount, savingsBankAccount];

  for (let i = 0; i < 200; i++) {
    const account = bankAccounts[i % bankAccounts.length];
    const txType = transactionTypes[i % transactionTypes.length];
    const amount = faker.number.float({ min: 100, max: 10000, multipleOf: 0.01 });
    const date = faker.date.between({ from: "2025-07-01", to: new Date() });

    const transaction = await prisma.transaction.create({
      data: {
        schoolId: school.id,
        accountId: account.accountId,
        bankAccountId: account.id,
        name: `${txType.category} - ${txType.subcategory}`,
        amount: txType.type === "credit" ? amount : -amount,
        date,
        paymentChannel: Math.random() > 0.5 ? "online" : "in_store",
        category: txType.category,
        subcategory: txType.subcategory,
        type: txType.type,
        pending: false,
        merchantName: txType.type === "debit" ? faker.company.name() : null,
        isoCurrencyCode: "USD",
      },
    });

    transactions.push(transaction);
  }

  console.log(`  ✅ Created 3 bank accounts with ${transactions.length} transactions`);

  // Create 5 transfers between accounts
  for (let i = 0; i < 5; i++) {
    await prisma.transfer.create({
      data: {
        schoolId: school.id,
        senderBankId: mainBankAccount.id,
        receiverBankId: i % 2 === 0 ? payrollBankAccount.id : savingsBankAccount.id,
        amount: faker.number.float({ min: 5000, max: 20000, multipleOf: 0.01 }),
        note: `Internal transfer ${i + 1}`,
        status: "completed",
        transferDate: faker.date.between({ from: "2025-07-01", to: new Date() }),
      },
    });
  }

  // Create 2 bank reconciliations
  await prisma.bankReconciliation.createMany({
    data: [
      {
        schoolId: school.id,
        bankAccountId: mainBankAccount.id,
        statementDate: new Date("2025-08-31"),
        statementBalance: 505000,
        bookBalance: 500000,
        difference: 5000,
        status: ReconciliationStatus.DISCREPANCY,
        notes: "Uncleared checks pending",
      },
      {
        schoolId: school.id,
        bankAccountId: payrollBankAccount.id,
        statementDate: new Date("2025-08-31"),
        statementBalance: 150000,
        bookBalance: 150000,
        difference: 0,
        status: ReconciliationStatus.COMPLETED,
        reconciledBy: accountantUser.id,
        reconciledAt: new Date("2025-09-01"),
      },
    ],
  });

  // ===== 9. WALLETS & WALLET TRANSACTIONS =====
  console.log("  💳 Creating wallets and wallet transactions...");

  // Create school wallet
  const schoolWallet = await prisma.wallet.create({
    data: {
      schoolId: school.id,
      walletType: WalletType.SCHOOL,
      ownerId: school.id,
      balance: 50000,
      currency: "USD",
      isActive: true,
    },
  });

  // Create wallet transactions
  const walletTransactions = [];
  for (let i = 0; i < 20; i++) {
    const type = i % 3 === 0 ? TransactionType.CREDIT : TransactionType.DEBIT;
    const amount = faker.number.float({ min: 100, max: 2000, multipleOf: 0.01 });
    const balanceAfter = type === TransactionType.CREDIT
      ? 50000 + amount * (i + 1)
      : 50000 - amount * i;

    const transaction = await prisma.walletTransaction.create({
      data: {
        schoolId: school.id,
        walletId: schoolWallet.id,
        type,
        amount,
        balanceAfter,
        description: type === TransactionType.CREDIT
          ? "Fee payment received"
          : "Refund processed",
        sourceModule: "fees",
        createdBy: accountantUser.id,
      },
    });
    walletTransactions.push(transaction);
  }

  console.log(`  ✅ Created school wallet with ${walletTransactions.length} transactions`);

  // ===== 10. BUDGETS & BUDGET ALLOCATIONS =====
  console.log("  📈 Creating budgets with allocations...");

  const budgets = [];
  for (let i = 0; i < 5; i++) {
    const budget = await prisma.budget.create({
      data: {
        schoolId: school.id,
        fiscalYearId: fiscalYear.id,
        name: `Budget ${i + 1} - FY 2025-2026`,
        description: `Annual budget for ${["Operations", "Academic", "Infrastructure", "IT", "Marketing"][i]}`,
        totalAmount: faker.number.int({ min: 50000, max: 200000 }),
        status: i < 3 ? BudgetStatus.ACTIVE : BudgetStatus.PENDING_APPROVAL,
        approvedBy: i < 3 ? adminUser.id : null,
        approvedAt: i < 3 ? new Date("2025-07-01") : null,
        createdBy: accountantUser.id,
      },
    });

    // Create allocations for each budget
    const categoryNames = ["Teaching Materials", "Office Supplies", "Utilities", "Maintenance", "IT Services"];
    for (const categoryName of categoryNames.slice(0, 3)) {
      const category = createdExpenseCategories.get(categoryName);
      if (category) {
        const allocated = faker.number.float({ min: 5000, max: 30000, multipleOf: 0.01 });
        const spent = faker.number.float({ min: 0, max: allocated * 0.8, multipleOf: 0.01 });

        await prisma.budgetAllocation.create({
          data: {
            schoolId: school.id,
            budgetId: budget.id,
            categoryId: category.id,
            allocated,
            spent,
            remaining: allocated - spent,
          },
        });
      }
    }

    budgets.push(budget);
  }

  console.log(`  ✅ Created ${budgets.length} budgets with allocations`);

  // ===== 11. EXPENSES WITH RECEIPTS =====
  console.log("  💸 Creating expenses with receipts (100+)...");

  const expenses = [];
  for (let i = 0; i < 100; i++) {
    const categoryName = ["Teaching Materials", "Office Supplies", "Utilities", "Maintenance", "IT Services", "Travel", "Insurance"][i % 7];
    const category = createdExpenseCategories.get(categoryName);

    if (category) {
      const expense = await prisma.expense.create({
        data: {
          schoolId: school.id,
          expenseNumber: `EXP-2025-${String(i + 1).padStart(4, "0")}`,
          categoryId: category.id,
          amount: faker.number.float({ min: 50, max: 5000, multipleOf: 0.01 }),
          expenseDate: faker.date.between({ from: "2025-07-01", to: new Date() }),
          vendor: faker.company.name(),
          description: `${categoryName} expense - ${faker.commerce.productDescription()}`,
          paymentMethod: ["Cash", "Bank Transfer", "Credit Card"][i % 3],
          status: i < 70 ? ExpenseStatus.PAID : i < 85 ? ExpenseStatus.APPROVED : ExpenseStatus.PENDING,
          submittedBy: accountantUser.id,
          submittedAt: faker.date.between({ from: "2025-07-01", to: new Date() }),
          approvedBy: i < 85 ? adminUser.id : null,
          approvedAt: i < 85 ? faker.date.between({ from: "2025-07-01", to: new Date() }) : null,
          paidAt: i < 70 ? faker.date.between({ from: "2025-07-01", to: new Date() }) : null,
        },
      });

      // Create expense receipt (50% have receipts)
      if (Math.random() > 0.5) {
        await prisma.expenseReceipt.create({
          data: {
            schoolId: school.id,
            userId: accountantUser.id,
            expenseId: expense.id,
            fileName: `receipt_${expense.expenseNumber}.pdf`,
            fileDisplayName: `Receipt for ${categoryName}`,
            fileUrl: `/uploads/receipts/receipt_${expense.expenseNumber}.pdf`,
            fileSize: faker.number.int({ min: 100000, max: 5000000 }),
            mimeType: "application/pdf",
            status: "processed",
            merchantName: faker.company.name(),
            transactionDate: expense.expenseDate,
            transactionAmount: expense.amount,
            currency: "USD",
            processedAt: new Date(),
          },
        });
      }

      expenses.push(expense);
    }
  }

  console.log(`  ✅ Created ${expenses.length} expenses with receipts`);

  // ===== 12. FINANCIAL REPORTS =====
  console.log("  📄 Creating financial reports...");

  const reportTypes = [
    FinancialReportType.PROFIT_LOSS,
    FinancialReportType.BALANCE_SHEET,
    FinancialReportType.CASH_FLOW,
    FinancialReportType.BUDGET_VARIANCE,
    FinancialReportType.PAYROLL_SUMMARY,
  ];

  for (const reportType of reportTypes) {
    await prisma.financialReport.create({
      data: {
        schoolId: school.id,
        reportType,
        reportName: `${reportType.replace(/_/g, " ")} Report`,
        fiscalYearId: fiscalYear.id,
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-12-31"),
        status: FinancialReportStatus.COMPLETED,
        generatedBy: accountantUser.id,
        fileUrl: `/reports/${reportType.toLowerCase()}_${Date.now()}.pdf`,
      },
    });
  }

  console.log(`  ✅ Created ${reportTypes.length} financial reports`);

  console.log("\n✅ Finance Module seeding complete!");
  console.log(`   📊 Summary:`);
  console.log(`      - Chart of Accounts: ${createdAccounts.length}`);
  console.log(`      - Expense Categories: ${createdExpenseCategories.size}`);
  console.log(`      - Salary Structures: ${salaryStructures.length}`);
  console.log(`      - Payroll Runs: ${payrollRuns.length}`);
  console.log(`      - Salary Slips: ${salaryStructures.length * payrollRuns.length}`);
  console.log(`      - User Invoices: ${invoices.length}`);
  console.log(`      - Bank Accounts: 3`);
  console.log(`      - Bank Transactions: ${transactions.length}`);
  console.log(`      - Wallets: 1`);
  console.log(`      - Wallet Transactions: ${walletTransactions.length}`);
  console.log(`      - Budgets: ${budgets.length}`);
  console.log(`      - Expenses: ${expenses.length}`);
  console.log(`      - Financial Reports: ${reportTypes.length}`);
}
