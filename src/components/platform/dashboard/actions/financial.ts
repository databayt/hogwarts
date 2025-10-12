"use server"

import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Financial Dashboard Actions
 * Server-side actions for financial metrics and tracking
 */

// ==================== FEE COLLECTION METRICS ====================

export async function getFeeCollectionMetrics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const now = new Date();
  const firstOfMonth = startOfMonth(now);
  const lastOfMonth = endOfMonth(now);
  const yearStart = startOfYear(now);

  // Since we don't have a fees table yet, we'll use mock calculations
  // In production, this would query actual fee payment records

  // TODO: Replace with actual database queries when fee tables are created
  const totalStudents = await db.student.count({ where: { schoolId } });

  // Mock fee structure (would come from school settings)
  const monthlyFeePerStudent = 5000; // Example: $5000 per student per month
  const expectedMonthlyRevenue = totalStudents * monthlyFeePerStudent;

  // Mock collection rate (would calculate from actual payments)
  const collectionRate = 0.85; // 85% collection rate
  const collectedAmount = expectedMonthlyRevenue * collectionRate;
  const pendingAmount = expectedMonthlyRevenue - collectedAmount;

  // Mock overdue calculations
  const overdueAmount = pendingAmount * 0.3; // 30% of pending is overdue

  return {
    totalExpected: expectedMonthlyRevenue,
    collected: collectedAmount,
    pending: pendingAmount,
    overdue: overdueAmount,
    collectionRate: collectionRate * 100,
    defaulters: Math.floor(totalStudents * (1 - collectionRate)),
    monthlyTarget: expectedMonthlyRevenue,
    yearToDate: collectedAmount * (now.getMonth() + 1), // YTD calculation
  };
}

// ==================== EXPENSE TRACKING ====================

export async function getExpenseMetrics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const now = new Date();
  const firstOfMonth = startOfMonth(now);
  const lastOfMonth = endOfMonth(now);

  // Mock expense categories (would query actual expense records)
  const expenseCategories = {
    salaries: 750000,      // Staff salaries
    utilities: 45000,      // Electricity, water, internet
    maintenance: 25000,    // Building and equipment maintenance
    supplies: 35000,       // Educational supplies
    transport: 20000,      // School transport
    activities: 15000,     // Extra-curricular activities
    administrative: 10000, // Admin expenses
    other: 5000,          // Miscellaneous
  };

  const totalExpenses = Object.values(expenseCategories).reduce((sum, val) => sum + val, 0);

  return {
    total: totalExpenses,
    categories: expenseCategories,
    monthToDate: totalExpenses * (now.getDate() / 30), // Prorated for current month
    trending: "stable" as "up" | "down" | "stable",
    largestCategory: "salaries",
    budgetUtilization: 78.5, // Mock budget utilization percentage
  };
}

// ==================== BUDGET ANALYSIS ====================

export async function getBudgetAnalysis() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const feeMetrics = await getFeeCollectionMetrics();
  const expenseMetrics = await getExpenseMetrics();

  const totalBudget = 1200000; // Annual budget (mock)
  const monthlyBudget = totalBudget / 12;
  const spent = expenseMetrics.total;
  const remaining = monthlyBudget - spent;
  const utilizationRate = (spent / monthlyBudget) * 100;

  // Calculate profit/loss
  const revenue = feeMetrics.collected;
  const profitLoss = revenue - spent;
  const profitMargin = (profitLoss / revenue) * 100;

  return {
    totalBudget: monthlyBudget,
    allocated: spent,
    remaining,
    utilizationRate,
    revenue,
    expenses: spent,
    profitLoss,
    profitMargin,
    status: utilizationRate > 90 ? "critical" : utilizationRate > 75 ? "warning" : "healthy",
    projectedYearEnd: spent * 12, // Simple projection
  };
}

// ==================== PAYMENT TRANSACTIONS ====================

export async function getRecentTransactions(limit: number = 10) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // Mock recent transactions (would query actual payment records)
  const mockTransactions = [
    {
      id: "txn_001",
      type: "fee_payment" as const,
      studentName: "John Smith",
      amount: 5000,
      status: "completed" as const,
      date: new Date(),
      method: "online" as const,
      reference: "PAY-2024-001",
    },
    {
      id: "txn_002",
      type: "fee_payment" as const,
      studentName: "Sarah Johnson",
      amount: 5000,
      status: "pending" as const,
      date: subMonths(new Date(), 1),
      method: "bank_transfer" as const,
      reference: "PAY-2024-002",
    },
    {
      id: "txn_003",
      type: "expense" as const,
      description: "Office Supplies",
      amount: -1200,
      status: "completed" as const,
      date: new Date(),
      category: "supplies",
      vendor: "ABC Supplies Ltd",
    },
  ];

  return mockTransactions.slice(0, limit);
}

// ==================== DEFAULTERS LIST ====================

export async function getFeeDefaulters(limit: number = 10) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // In production, this would query students with overdue payments
  const students = await db.student.findMany({
    where: { schoolId },
    take: limit,
    select: {
      id: true,
      studentId: true,
      givenName: true,
      surname: true,
      studentYearLevels: {
        select: {
          yearLevel: {
            select: {
              levelName: true,
            },
          },
        },
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      },
    },
  });

  // Mock defaulter data
  return students.slice(0, 5).map(student => ({
    id: student.id,
    studentId: student.studentId,
    name: `${student.givenName} ${student.surname}`,
    class: student.studentYearLevels?.[0]?.yearLevel?.levelName || "N/A",
    outstandingAmount: Math.floor(Math.random() * 10000) + 5000,
    monthsOverdue: Math.floor(Math.random() * 3) + 1,
    lastPaymentDate: subMonths(new Date(), Math.floor(Math.random() * 6) + 1),
  }));
}

// ==================== FINANCIAL SUMMARY ====================

export async function getFinancialSummary() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [feeMetrics, expenseMetrics, budgetAnalysis, recentTransactions, defaulters] =
    await Promise.all([
      getFeeCollectionMetrics(),
      getExpenseMetrics(),
      getBudgetAnalysis(),
      getRecentTransactions(5),
      getFeeDefaulters(5),
    ]);

  return {
    revenue: {
      total: feeMetrics.collected,
      pending: feeMetrics.pending,
      overdue: feeMetrics.overdue,
      collectionRate: feeMetrics.collectionRate,
    },
    expenses: {
      total: expenseMetrics.total,
      categories: expenseMetrics.categories,
      budgetUtilization: expenseMetrics.budgetUtilization,
    },
    budget: {
      allocated: budgetAnalysis.allocated,
      remaining: budgetAnalysis.remaining,
      utilizationRate: budgetAnalysis.utilizationRate,
      status: budgetAnalysis.status,
    },
    profitLoss: {
      amount: budgetAnalysis.profitLoss,
      margin: budgetAnalysis.profitMargin,
      trend: budgetAnalysis.profitLoss > 0 ? "profit" : "loss",
    },
    recentTransactions,
    defaulters,
    alerts: [
      ...(feeMetrics.collectionRate < 70 ? [{
        type: "fee_collection",
        message: "Fee collection rate below 70%",
        severity: "high",
      }] : []),
      ...(budgetAnalysis.utilizationRate > 90 ? [{
        type: "budget",
        message: "Budget utilization above 90%",
        severity: "medium",
      }] : []),
      ...(defaulters.length > 10 ? [{
        type: "defaulters",
        message: `${defaulters.length} students have overdue payments`,
        severity: "medium",
      }] : []),
    ],
  };
}

// ==================== FINANCIAL REPORTS ====================

export async function generateFinancialReport(
  reportType: "monthly" | "quarterly" | "annual",
  date: Date = new Date()
) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // This would generate comprehensive financial reports
  // For now, return a summary structure

  const summary = await getFinancialSummary();

  return {
    type: reportType,
    generatedAt: new Date(),
    period: {
      start: reportType === "monthly" ? startOfMonth(date) :
             reportType === "quarterly" ? subMonths(date, 3) :
             startOfYear(date),
      end: date,
    },
    summary,
    recommendations: [
      "Focus on improving fee collection from defaulters",
      "Review and optimize utility expenses",
      "Consider digital payment options to improve collection rate",
    ],
  };
}

// ==================== PAYMENT PROCESSING ====================

export async function recordPayment(data: {
  studentId: string;
  amount: number;
  method: "cash" | "online" | "bank_transfer" | "cheque";
  reference?: string;
  notes?: string;
}) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // Validate student exists and belongs to school
  const student = await db.student.findFirst({
    where: {
      id: data.studentId,
      schoolId,
    },
  });

  if (!student) {
    throw new Error("Student not found or doesn't belong to this school");
  }

  // In production, this would create a payment record
  // For now, return mock success response
  return {
    success: true,
    transactionId: `TXN-${Date.now()}`,
    amount: data.amount,
    studentName: `${student.givenName} ${student.surname}`,
    timestamp: new Date(),
    reference: data.reference || `PAY-${Date.now()}`,
  };
}

// ==================== FEE STRUCTURE MANAGEMENT ====================

export async function getFeeStructure() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // Mock fee structure (would query from database)
  return {
    tuitionFee: {
      monthly: 5000,
      quarterly: 14500, // With discount
      annual: 55000, // With larger discount
    },
    additionalFees: {
      registration: 1000,
      examination: 500,
      laboratory: 300,
      sports: 200,
      library: 150,
      transport: 800,
    },
    discounts: {
      sibling: 10, // 10% discount
      earlyPayment: 5, // 5% discount
      merit: 15, // 15% for top performers
    },
    lateFees: {
      rate: 2, // 2% per month
      gracePeriod: 7, // 7 days grace period
    },
  };
}