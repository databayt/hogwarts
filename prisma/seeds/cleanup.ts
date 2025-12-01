/**
 * Database Cleanup Module
 * Deletes ALL existing data from the database
 */

import type { SeedPrisma } from "./types";

export async function seedCleanup(prisma: SeedPrisma): Promise<void> {
  console.log("\n🗑️  Deleting ALL existing data from database...");
  console.log("   (This ensures a clean demo-only setup)\n");

  // Delete in reverse dependency order to avoid FK constraints
  // Using individual try-catch to handle models that may not exist
  const models = [
    // Stream/LMS (order matters for FK constraints)
    "streamLessonProgress",
    "streamAttachment",
    "streamLesson",
    "streamChapter",
    "streamEnrollment",
    "streamCertificate",
    "streamCourse",
    "streamCategory",

    // Finance - Reports
    "financialReport",

    // Finance - Expenses
    "expenseReceipt",
    "expense",
    "budgetAllocation",
    "budget",

    // Finance - Wallet
    "walletTransaction",
    "wallet",

    // Finance - Banking
    "transfer",
    "bankReconciliation",
    "transaction",
    "bankAccount",
    "dwollaCustomer",
    "plaidItem",

    // Finance - Invoice
    "userInvoiceItem",
    "userInvoice",
    "userInvoiceAddress",
    "userInvoiceSignature",
    "userInvoiceSettings",
    "receipt",

    // Finance - Payroll
    "salarySlip",
    "payrollRun",
    "timesheetEntry",
    "timesheetPeriod",
    "salaryDeduction",
    "salaryAllowance",
    "salaryStructure",

    // Finance - Core
    "financePermission",
    "ledgerEntry",
    "journalEntry",
    "accountBalance",
    "expenseCategory",
    "chartOfAccount",
    "fiscalYear",

    // Exams - Auto-Marking & Question Bank (must come before exam)
    "gradeOverride",
    "markingResult",
    "studentAnswer",
    "rubricCriterion",
    "rubric",
    "generatedExamQuestion",
    "generatedExam",
    "examTemplate",
    "questionReview",
    "questionAnalytics",
    "sourceChunk",
    "sourceMaterial",
    "generationJob",
    "quizGameQuestion",
    "quizGame",
    "questionBank",

    // Academics
    "reportCardGrade",
    "reportCard",
    "result",
    "examResult",
    "exam",
    "gradeBoundary",
    "attendance",
    "assignmentSubmission",
    "assignment",
    "scoreRange",
    "lesson",
    "timetable",
    "schoolWeekConfig",
    "studentClass",
    "class",
    "studentYearLevel",

    // Library
    "borrowRecord",
    "book",

    // Fees
    "refund",
    "fine",
    "scholarshipApplication",
    "scholarship",
    "payment",
    "feeAssignment",
    "feeStructure",

    // Admission
    "communication",
    "application",
    "admissionCampaign",

    // People
    "studentGuardian",
    "guardianPhoneNumber",
    "guardian",
    "teacherDepartment",
    "teacher",
    "student",

    // Academic Structure
    "classroom",
    "classroomType",
    "subject",
    "department",
    "yearLevel",
    "period",
    "term",
    "schoolYear",

    // Announcements
    "announcement",

    // Guardian Types
    "guardianType",

    // School Configuration
    "schoolBranding",

    // Auth
    "session",
    "account",
    "verificationToken",
    "passwordResetToken",
    "twoFactorToken",
    "twoFactorConfirmation",
    "user",

    // Schools (last)
    "school",
  ];

  for (const model of models) {
    try {
      // @ts-expect-error - dynamic model access
      if (prisma[model]?.deleteMany) {
        // @ts-expect-error - dynamic model access
        await prisma[model].deleteMany();
      }
    } catch {
      // Continue if model doesn't exist or has issues
    }
  }

  console.log("   ✅ All existing data deleted\n");
}
