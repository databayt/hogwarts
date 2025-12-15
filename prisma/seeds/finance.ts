/**
 * Finance Seed Module - Bilingual (AR/EN)
 * Creates comprehensive financial data for full fiscal year:
 * - 12 months of payroll (30 teachers)
 * - 12 months of timesheets
 * - 200+ bank transactions
 * - Full year expense tracking
 * - Double-entry bookkeeping ledger
 *
 * Currency: SDG (Sudanese Pound) - Comboni School Port Sudan
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

// SDG Exchange rate context (for realistic amounts)
// 1 USD ≈ 600 SDG (approximate, for demo purposes)

export async function seedFinance(
  prisma: SeedPrisma,
  schoolId: string,
  schoolName: string,
  users: UserRef[],
  teachers: TeacherRef[],
  students: StudentRef[]
): Promise<void> {
  console.log("💰 Creating finance module (12 months, SDG - Bilingual AR/EN)...");

  const adminUser = users.find(u => u.email.includes("admin"));
  const accountantUser = users.find(u => u.email.includes("accountant"));

  if (!adminUser || !accountantUser) {
    console.log("   ⚠️ Admin or accountant not found, skipping finance\n");
    return;
  }

  // ===== FISCAL YEAR =====
  let fiscalYear = await prisma.fiscalYear.findFirst({
    where: { schoolId, name: "FY 2025-2026" },
  });
  if (!fiscalYear) {
    fiscalYear = await prisma.fiscalYear.create({
      data: {
        schoolId,
        name: "FY 2025-2026",
        startDate: new Date("2025-07-01T00:00:00Z"),
        endDate: new Date("2026-06-30T23:59:59Z"),
        isCurrent: true,
        isClosed: false,
      },
    });
  }

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
    // Find or create chart of account
    let account = await prisma.chartOfAccount.findFirst({
      where: { schoolId, code: acc.code },
    });
    if (!account) {
      account = await prisma.chartOfAccount.create({
        data: { schoolId, ...acc, isActive: true },
      });
    }
    createdAccounts.push(account);
  }

  // ===== EXPENSE CATEGORIES =====
  const expenseCategories = ["Personnel", "Facilities", "Academic", "Administration", "Financial"];
  const createdCategories = new Map<string, string>();

  for (const name of expenseCategories) {
    // Find or create expense category
    let cat = await prisma.expenseCategory.findFirst({
      where: { schoolId, name },
    });
    if (!cat) {
      cat = await prisma.expenseCategory.create({
        data: { schoolId, name, isActive: true, requiresApproval: true },
      });
    }
    createdCategories.set(name, cat.id);
  }

  // ===== SALARY STRUCTURES (for 30 teachers) =====
  // Salaries in SDG (Sudanese Pound) - Realistic for Comboni School teachers
  const salaryStructures: { id: string; baseSalary: number; teacher: TeacherRef }[] = [];

  for (const teacher of teachers.slice(0, 30)) {
    // Check if salary structure already exists for this teacher
    let structure = await prisma.salaryStructure.findFirst({
      where: { schoolId, teacherId: teacher.id, isActive: true },
    });

    if (!structure) {
      // Teacher salaries in SDG (approximately 600,000 - 1,800,000 SDG/month = ~$1K-3K USD)
      const baseSalary = faker.number.int({ min: 600000, max: 1800000 });

      structure = await prisma.salaryStructure.create({
        data: {
          schoolId,
          teacherId: teacher.id,
          effectiveFrom: new Date("2025-07-01T00:00:00Z"),
          baseSalary,
          currency: "SDG",  // Sudanese Pound
          payFrequency: PayFrequency.MONTHLY,
          isActive: true,
        },
      });

      await prisma.salaryAllowance.createMany({
        data: [
          { schoolId, structureId: structure.id, name: "Housing Allowance", amount: baseSalary * 0.25, isTaxable: true, isRecurring: true },
          { schoolId, structureId: structure.id, name: "Transport Allowance", amount: baseSalary * 0.10, isTaxable: true, isRecurring: true },
        ],
        skipDuplicates: true,
      });

      await prisma.salaryDeduction.createMany({
        data: [
          { schoolId, structureId: structure.id, name: "Income Tax", amount: baseSalary * 0.15, type: DeductionType.TAX, isRecurring: true },
          { schoolId, structureId: structure.id, name: "Pension", amount: baseSalary * 0.08, type: DeductionType.PENSION, isRecurring: true },
        ],
        skipDuplicates: true,
      });

      salaryStructures.push({ id: structure.id, baseSalary, teacher });
    } else {
      salaryStructures.push({ id: structure.id, baseSalary: Number(structure.baseSalary), teacher });
    }
  }

  // ===== TIMESHEET PERIODS (12 months - Full Fiscal Year) =====
  for (let month = 0; month < 12; month++) {
    const startDate = new Date(2025, 6 + month, 1);
    const endDate = new Date(2025, 7 + month, 0);
    const periodName = `${startDate.toLocaleString('default', { month: 'long' })} ${startDate.getFullYear()}`;

    // Check if period already exists
    let period = await prisma.timesheetPeriod.findFirst({
      where: { schoolId, name: periodName },
    });

    // Determine period status based on current date
    const now = new Date();
    const isFuture = startDate > now;
    const isCurrent = startDate <= now && endDate >= now;
    const isPast = endDate < now;

    if (!period) {
      period = await prisma.timesheetPeriod.create({
        data: {
          schoolId,
          name: periodName,
          startDate,
          endDate,
          status: isFuture ? PeriodStatus.OPEN : isPast ? PeriodStatus.CLOSED : PeriodStatus.OPEN,
          closedBy: isPast ? accountantUser.id : null,
          closedAt: isPast ? new Date(endDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
        },
      });

      // Timesheet entries for all teachers (only for past/current periods)
      if (!isFuture) {
        const entries = [];
        for (const { teacher } of salaryStructures) {
          // Create entries for working days (Mon-Thu, each week)
          for (let week = 0; week < 4; week++) {
            for (let day = 0; day < 4; day++) { // Mon-Thu (Sudan work week)
              const entryDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1 + (week * 7) + day + 1);
              if (entryDate <= now && entryDate.getMonth() === startDate.getMonth()) {
                // Some variation in hours and occasional leave
                const hasOvertime = Math.random() < 0.15;
                const hasLeave = Math.random() < 0.05;
                entries.push({
                  schoolId,
                  periodId: period.id,
                  teacherId: teacher.id,
                  entryDate,
                  hoursWorked: hasLeave ? 0 : 8,
                  overtimeHours: hasOvertime ? faker.number.int({ min: 1, max: 3 }) : 0,
                  leaveHours: hasLeave ? 8 : 0,
                  status: EntryStatus.APPROVED,
                  submittedBy: teacher.id,
                  submittedAt: new Date(entryDate.getTime() + 24 * 60 * 60 * 1000),
                  approvedBy: adminUser.id,
                  approvedAt: new Date(entryDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                });
              }
            }
          }
        }

        if (entries.length > 0) {
          await prisma.timesheetEntry.createMany({ data: entries, skipDuplicates: true });
        }
      }
    }
  }

  // ===== PAYROLL RUNS (12 months - Full Fiscal Year) =====
  const currentDate = new Date();
  for (let month = 0; month < 12; month++) {
    const payPeriodStart = new Date(2025, 6 + month, 1);
    const payPeriodEnd = new Date(2025, 7 + month, 0);
    const payDate = new Date(2025, 7 + month, 1);
    const runNumber = `PR-2025-${String(month + 1).padStart(3, "0")}`;

    // Skip future months
    if (payPeriodStart > currentDate) continue;

    // Check if payroll run already exists
    const existingRun = await prisma.payrollRun.findFirst({
      where: { schoolId, runNumber },
    });

    if (!existingRun) {
      // Determine status based on date
      const isPaid = payDate <= currentDate;
      const isProcessing = !isPaid && payPeriodEnd <= currentDate;

      const run = await prisma.payrollRun.create({
        data: {
          schoolId,
          runNumber,
          payPeriodStart,
          payPeriodEnd,
          payDate,
          status: isPaid ? PayrollStatus.PAID : isProcessing ? PayrollStatus.PROCESSING : PayrollStatus.DRAFT,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          processedBy: isPaid || isProcessing ? accountantUser.id : null,
          processedAt: isPaid ? new Date(payDate.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
          approvedBy: isPaid ? adminUser.id : null,
          approvedAt: isPaid ? new Date(payDate.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
        },
      });

      let totalGross = 0, totalDeductions = 0, totalNet = 0;

      for (const { id: structureId, baseSalary, teacher } of salaryStructures) {
        // Add some variation: annual increments, bonuses
        const yearlyIncrement = month >= 6 ? baseSalary * 0.05 : 0; // 5% increment after 6 months
        const eidBonus = (month === 2 || month === 9) ? baseSalary * 0.5 : 0; // Eid bonuses
        const adjustedBase = baseSalary + yearlyIncrement;

        const housingAllowance = adjustedBase * 0.25;
        const transportAllowance = adjustedBase * 0.10;
        const allowanceAmount = housingAllowance + transportAllowance;
        const grossSalary = adjustedBase + allowanceAmount + eidBonus;

        const taxAmount = adjustedBase * 0.15;
        const pension = adjustedBase * 0.08;
        const healthInsurance = adjustedBase * 0.02;
        const deductions = taxAmount + pension + healthInsurance;
        const netSalary = grossSalary - deductions;

        // Realistic attendance variation
        const daysInMonth = new Date(payPeriodEnd.getFullYear(), payPeriodEnd.getMonth() + 1, 0).getDate();
        const workDays = Math.floor(daysInMonth * 4 / 7); // ~4 work days per week in Sudan
        const daysAbsent = faker.number.int({ min: 0, max: 2 });
        const daysPresent = workDays - daysAbsent;

        await prisma.salarySlip.create({
          data: {
            schoolId,
            payrollRunId: run.id,
            structureId,
            teacherId: teacher.id,
            slipNumber: `SLP-${run.runNumber}-${structureId.substring(0, 8)}`,
            payPeriodStart,
            payPeriodEnd,
            payDate,
            baseSalary: adjustedBase,
            allowances: [
              { name: "بدل سكن | Housing", amount: housingAllowance },
              { name: "بدل مواصلات | Transport", amount: transportAllowance },
              ...(eidBonus > 0 ? [{ name: "مكافأة العيد | Eid Bonus", amount: eidBonus }] : []),
            ],
            overtime: faker.number.int({ min: 0, max: 8 }) * (adjustedBase / 176), // Occasional overtime
            bonus: eidBonus,
            grossSalary,
            taxAmount,
            insurance: healthInsurance,
            loanDeduction: 0,
            otherDeductions: [],
            totalDeductions: deductions,
            netSalary,
            daysWorked: workDays,
            daysPresent,
            daysAbsent,
            hoursWorked: daysPresent * 8,
            status: isPaid ? SlipStatus.PAID : isProcessing ? SlipStatus.REVIEWED : SlipStatus.GENERATED,
            paidAt: isPaid ? payDate : null,
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
  }

  // ===== BANK ACCOUNTS =====
  // Bank of Khartoum - Main Operating Account (SDG)
  let mainBank = await prisma.bankAccount.findFirst({
    where: { schoolId, name: "Main Operating Account - Bank of Khartoum" },
  });

  if (!mainBank) {
    mainBank = await prisma.bankAccount.create({
      data: {
        schoolId,
        userId: adminUser.id,
        bankId: "bank_khartoum",
        accountId: `ACC-${faker.finance.accountNumber(10)}`,
        accessToken: "encrypted_token",
        institutionId: "inst_sudan_001",
        name: "Main Operating Account - Bank of Khartoum",
        officialName: `${schoolName} Operating`,
        mask: "1234",
        currentBalance: 45000000,  // 45M SDG (~$75K USD)
        availableBalance: 42000000,  // 42M SDG (~$70K USD)
        type: "depository",
        subtype: "checking",
      },
    });
  }

  // Bank transactions (200+) in SDG - Full year of banking activity
  const existingTxCount = await prisma.transaction.count({ where: { schoolId, bankAccountId: mainBank.id } });
  if (existingTxCount < 200) {
    // Transaction categories with bilingual descriptions
    const transactionTypes = [
      // Income transactions
      { type: "credit", category: "Tuition", names: ["دفع رسوم دراسية | Tuition Payment", "قسط فصلي | Term Installment", "تسديد رسوم | Fee Settlement"] },
      { type: "credit", category: "Registration", names: ["رسوم تسجيل | Registration Fee", "رسوم قبول | Admission Fee"] },
      { type: "credit", category: "Transport", names: ["رسوم النقل | Transport Fee", "اشتراك الباص | Bus Subscription"] },
      { type: "credit", category: "Activities", names: ["رسوم الأنشطة | Activity Fee", "رسوم الرحلات | Trip Fee"] },
      // Expense transactions
      { type: "debit", category: "Salaries", names: ["رواتب المعلمين | Teacher Salaries", "رواتب الموظفين | Staff Salaries"] },
      { type: "debit", category: "Utilities", names: ["فاتورة الكهرباء | Electricity Bill", "فاتورة المياه | Water Bill", "فاتورة الإنترنت | Internet Bill"] },
      { type: "debit", category: "Supplies", names: ["مستلزمات مكتبية | Office Supplies", "مستلزمات تنظيف | Cleaning Supplies", "مستلزمات صحية | Health Supplies"] },
      { type: "debit", category: "Maintenance", names: ["صيانة المباني | Building Maintenance", "صيانة الأجهزة | Equipment Maintenance"] },
      { type: "debit", category: "Educational", names: ["كتب مدرسية | Textbooks", "معدات معملية | Lab Equipment", "وسائل تعليمية | Teaching Aids"] },
      { type: "debit", category: "Vendor", names: ["دفع لمورد | Vendor Payment", "مستحقات متعهد | Contractor Payment"] },
    ];

    for (let i = 0; i < 200; i++) {
      const txType = transactionTypes[i % transactionTypes.length];
      const isCredit = txType.type === "credit";

      // Vary amounts based on category
      let minAmount: number, maxAmount: number;
      switch (txType.category) {
        case "Tuition":
          minAmount = 300000; maxAmount = 1800000; break;
        case "Salaries":
          minAmount = 600000; maxAmount = 2000000; break;
        case "Utilities":
          minAmount = 50000; maxAmount = 300000; break;
        case "Supplies":
          minAmount = 30000; maxAmount = 150000; break;
        default:
          minAmount = 60000; maxAmount = 600000;
      }

      const amount = faker.number.float({ min: minAmount, max: maxAmount, multipleOf: 0.01 });
      const txDate = faker.date.between({ from: "2025-07-01", to: new Date() });
      const txName = faker.helpers.arrayElement(txType.names);

      await prisma.transaction.create({
        data: {
          schoolId,
          accountId: mainBank.accountId,
          bankAccountId: mainBank.id,
          name: txName,
          amount: isCredit ? amount : -amount,
          date: txDate,
          paymentChannel: faker.helpers.arrayElement(["online", "bank_transfer", "cash", "cheque"]),
          category: txType.category,
          type: isCredit ? "credit" : "debit",
          pending: txDate > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Last 3 days pending
          isoCurrencyCode: "SDG",
        },
      });
    }
    console.log(`   ✅ Created: 200 bank transactions`);
  }

  // ===== WALLET (findFirst + create) =====
  let wallet = await prisma.wallet.findFirst({
    where: { schoolId, walletType: WalletType.SCHOOL, ownerId: schoolId },
  });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        schoolId,
        walletType: WalletType.SCHOOL,
        ownerId: schoolId,
        balance: 30000000,  // 30M SDG
        currency: "SDG",
        isActive: true,
      },
    });

    // Only create transactions for new wallets
    for (let i = 0; i < 10; i++) {
      const type = i % 2 === 0 ? TransactionType.CREDIT : TransactionType.DEBIT;
      const amount = faker.number.float({ min: 60000, max: 1200000, multipleOf: 0.01 });  // SDG amounts

      await prisma.walletTransaction.create({
        data: {
          schoolId,
          walletId: wallet.id,
          type,
          amount,
          balanceAfter: 30000000 + (type === TransactionType.CREDIT ? amount : -amount),
          description: type === TransactionType.CREDIT ? "استلام دفعة | Payment received" : "معالجة استرداد | Refund processed",
          sourceModule: "fees",
          createdBy: accountantUser.id,
        },
      });
    }
  }

  // ===== BUDGETS (skip if any exist) =====
  const existingBudgets = await prisma.budget.findFirst({ where: { schoolId } });
  if (!existingBudgets) {
    // Budgets in SDG
    for (let i = 0; i < 3; i++) {
      const budget = await prisma.budget.create({
        data: {
          schoolId,
          fiscalYearId: fiscalYear.id,
          name: `ميزانية ${i + 1} | Budget ${i + 1} - FY 2025-2026`,
          description: `Department budget ${i + 1} - Comboni School`,
          totalAmount: faker.number.int({ min: 15000000, max: 45000000 }),  // 15M - 45M SDG (~$25K-75K USD)
          status: BudgetStatus.ACTIVE,
          approvedBy: adminUser.id,
          approvedAt: new Date("2025-07-01"),
          createdBy: accountantUser.id,
        },
      });

      const categoryId = Array.from(createdCategories.values())[i % createdCategories.size];
      const allocated = faker.number.float({ min: 3000000, max: 18000000, multipleOf: 0.01 });  // SDG
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
  }

  // ===== EXPENSES (skip if any exist) =====
  const existingExpenses = await prisma.expense.findFirst({ where: { schoolId } });
  if (!existingExpenses) {
    // Expenses in SDG with Sudanese vendors
    const sudaneseVendors = [
      "مكتبة الخرطوم | Khartoum Bookstore",
      "شركة أفرو للتوريدات | Afro Supplies Co.",
      "مطابع السودان | Sudan Press",
      "شركة النيل للأثاث | Nile Furniture Co.",
      "مؤسسة الرياض للمستلزمات | Riyadh Supplies",
      "شركة البحر الأحمر | Red Sea Company",
      "مكتبة العلم | Al-Ilm Bookstore",
      "شركة الشرق للتقنية | East Tech Co.",
    ];
    const categoryIds = Array.from(createdCategories.values());
    for (let i = 0; i < 30; i++) {
      await prisma.expense.create({
        data: {
          schoolId,
          expenseNumber: `EXP-2025-${String(i + 1).padStart(4, "0")}`,
          categoryId: categoryIds[i % categoryIds.length],
          amount: faker.number.float({ min: 30000, max: 1200000, multipleOf: 0.01 }),  // SDG amounts
          expenseDate: faker.date.between({ from: "2025-07-01", to: new Date() }),
          vendor: sudaneseVendors[i % sudaneseVendors.length],
          description: "مصاريف تشغيلية | Operating expense",
          paymentMethod: ["Cash", "Bank Transfer", "Cheque"][i % 3],
          status: i < 20 ? ExpenseStatus.PAID : ExpenseStatus.APPROVED,
          submittedBy: accountantUser.id,
          submittedAt: faker.date.between({ from: "2025-07-01", to: new Date() }),
          approvedBy: adminUser.id,
          approvedAt: faker.date.between({ from: "2025-07-01", to: new Date() }),
          paidAt: i < 20 ? faker.date.between({ from: "2025-07-01", to: new Date() }) : null,
        },
      });
    }
  }

  // ===== USER INVOICES (skip if any exist) =====
  const existingInvoices = await prisma.userInvoice.findFirst({ where: { schoolId } });
  if (!existingInvoices) {
    // Invoices in SDG - Comboni School
    for (let i = 0; i < 20; i++) {
      const user = users[i % users.length];
      const invoiceDate = faker.date.between({ from: "2025-07-01", to: new Date() });
      const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const isPaid = i < 12;

      const fromAddress = await prisma.userInvoiceAddress.create({
        data: {
          schoolId,
          name: "مدرسة كمبوني | Comboni School",
          email: `billing@demo.databayt.org`,
          address1: "الخرطوم، السودان | Khartoum, Sudan",
        },
      });

      const toAddress = await prisma.userInvoiceAddress.create({
        data: {
          schoolId,
          name: faker.person.fullName(),
          email: user.email,
          address1: "الخرطوم | Khartoum",
        },
      });

      const subTotal = faker.number.float({ min: 300000, max: 1800000, multipleOf: 0.01 });  // SDG
      const tax = subTotal * 0.1;
      const total = subTotal + tax;

      const invoice = await prisma.userInvoice.create({
        data: {
          schoolId,
          userId: user.id,
          invoice_no: `INV-2025-${String(i + 1).padStart(4, "0")}`,
          invoice_date: invoiceDate,
          due_date: dueDate,
          currency: "SDG",  // Sudanese Pound
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
          item_name: "الرسوم الدراسية | Tuition Fee",
          quantity: 1,
          price: subTotal,
          total: subTotal,
        },
      });
    }
  }

  // ===== FINANCIAL REPORTS (skip if any exist) =====
  const existingReports = await prisma.financialReport.findFirst({ where: { schoolId } });
  if (!existingReports) {
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
  }

  // ===== JOURNAL ENTRIES & LEDGER (Double-Entry Bookkeeping) =====
  const existingJournals = await prisma.journalEntry.count({ where: { schoolId } });
  if (existingJournals < 50) {
    console.log("   📒 Creating double-entry bookkeeping ledger...");

    // Get account IDs for ledger entries
    const accountMap = new Map<string, string>();
    for (const acc of createdAccounts) {
      accountMap.set(acc.code, acc.id);
    }

    // Journal entry templates for school transactions
    const journalTemplates = [
      {
        description: "تحصيل رسوم دراسية | Tuition Fee Collection",
        sourceModule: "fees",
        entries: [
          { accountCode: "1100", debit: true },  // Bank Account - Main (Debit)
          { accountCode: "4000", debit: false }, // Tuition Revenue (Credit)
        ],
        minAmount: 300000,
        maxAmount: 1500000,
      },
      {
        description: "دفع رواتب المعلمين | Teacher Salary Payment",
        sourceModule: "payroll",
        entries: [
          { accountCode: "5000", debit: true },  // Salaries Expense (Debit)
          { accountCode: "1100", debit: false }, // Bank Account - Main (Credit)
        ],
        minAmount: 180000,
        maxAmount: 600000,
      },
      {
        description: "دفع فواتير الخدمات | Utility Bills Payment",
        sourceModule: "expenses",
        entries: [
          { accountCode: "5100", debit: true },  // Utilities Expense (Debit)
          { accountCode: "1000", debit: false }, // Cash (Credit)
        ],
        minAmount: 30000,
        maxAmount: 150000,
      },
      {
        description: "شراء مستلزمات مكتبية | Office Supplies Purchase",
        sourceModule: "expenses",
        entries: [
          { accountCode: "5200", debit: true },  // Office Supplies (Debit)
          { accountCode: "2000", debit: false }, // Accounts Payable (Credit)
        ],
        minAmount: 15000,
        maxAmount: 90000,
      },
      {
        description: "استلام نقدي من أولياء الأمور | Cash Receipt from Parents",
        sourceModule: "fees",
        entries: [
          { accountCode: "1000", debit: true },  // Cash (Debit)
          { accountCode: "1200", debit: false }, // Accounts Receivable (Credit)
        ],
        minAmount: 60000,
        maxAmount: 300000,
      },
      {
        description: "دفع مستحقات الموردين | Vendor Payment",
        sourceModule: "expenses",
        entries: [
          { accountCode: "2000", debit: true },  // Accounts Payable (Debit)
          { accountCode: "1100", debit: false }, // Bank Account - Main (Credit)
        ],
        minAmount: 45000,
        maxAmount: 450000,
      },
    ];

    let journalCount = 0;
    let ledgerCount = 0;

    // Create 100 journal entries over the fiscal year
    for (let i = 0; i < 100; i++) {
      const template = journalTemplates[i % journalTemplates.length];
      const entryDate = faker.date.between({ from: "2025-07-01", to: new Date() });
      const amount = faker.number.float({
        min: template.minAmount,
        max: template.maxAmount,
        multipleOf: 0.01,
      });

      const journalEntry = await prisma.journalEntry.create({
        data: {
          schoolId,
          entryNumber: `JE-2025-${String(i + 1).padStart(5, "0")}`,
          entryDate,
          description: template.description,
          reference: `REF-${faker.string.alphanumeric(8).toUpperCase()}`,
          sourceModule: template.sourceModule,
          isPosted: true,
          postedAt: new Date(entryDate.getTime() + 24 * 60 * 60 * 1000), // Posted next day
          postedBy: accountantUser.id,
          fiscalYearId: fiscalYear.id,
          createdBy: accountantUser.id,
        },
      });

      journalCount++;

      // Create ledger entries (double-entry: debits = credits)
      for (const entry of template.entries) {
        const accountId = accountMap.get(entry.accountCode);
        if (accountId) {
          await prisma.ledgerEntry.create({
            data: {
              schoolId,
              journalEntryId: journalEntry.id,
              accountId,
              debit: entry.debit ? amount : 0,
              credit: entry.debit ? 0 : amount,
              description: template.description,
            },
          });
          ledgerCount++;
        }
      }
    }

    console.log(`   ✅ Created ${journalCount} journal entries with ${ledgerCount} ledger entries`);
  }

  console.log(`   ✅ Created: Chart of accounts, Payroll (12 months), Banking (200+ tx), Budgets, Expenses, Invoices, Ledger\n`);
}
