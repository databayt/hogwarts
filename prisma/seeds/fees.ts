/**
 * Fees Seed
 * Creates Fee Structures, Fee Assignments, Payments, Fines, and Scholarships
 *
 * Phase 10: Fees & Invoices
 *
 * Features:
 * - 2-year history (2024-2025 historical + 2025-2026 current)
 * - 1000+ fee assignments (all students, both years)
 * - 500+ payment records with receipt numbers
 * - 100+ fines (10% of students)
 * - 50 scholarship applications
 *
 * Note: FeeStructure has no unique constraint, using findFirst + create
 * FeeAssignment has @@unique([studentId, feeStructureId, academicYear])
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef, YearLevelRef } from "./types"
import {
  logPhase,
  logSuccess,
  processBatch,
  randomElement,
  randomNumber,
} from "./utils"

// ============================================================================
// FEE STRUCTURES BY LEVEL
// ============================================================================

const FEE_STRUCTURES = [
  // Kindergarten
  {
    name: "Kindergarten Fee Structure",
    levels: ["KG1", "KG2"],
    tuitionFee: 15000,
    registrationFee: 500,
    libraryFee: 200,
    sportsFee: 300,
    transportFee: 2000,
    description: "Fee structure for kindergarten students",
  },
  // Primary (Grades 1-6)
  {
    name: "Primary Fee Structure",
    levels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
    tuitionFee: 18000,
    registrationFee: 600,
    examFee: 300,
    libraryFee: 250,
    laboratoryFee: 200,
    sportsFee: 400,
    transportFee: 2500,
    description: "Fee structure for primary school students",
  },
  // Intermediate (Grades 7-9)
  {
    name: "Intermediate Fee Structure",
    levels: ["Grade 7", "Grade 8", "Grade 9"],
    tuitionFee: 22000,
    registrationFee: 750,
    examFee: 400,
    libraryFee: 300,
    laboratoryFee: 400,
    sportsFee: 500,
    transportFee: 3000,
    description: "Fee structure for intermediate school students",
  },
  // Secondary (Grades 10-12)
  {
    name: "Secondary Fee Structure",
    levels: ["Grade 10", "Grade 11", "Grade 12"],
    tuitionFee: 28000,
    registrationFee: 1000,
    examFee: 600,
    libraryFee: 400,
    laboratoryFee: 600,
    sportsFee: 600,
    transportFee: 3500,
    description: "Fee structure for secondary school students",
  },
]

// Fee amounts by level
const FEE_AMOUNTS: Record<string, number> = {
  KG1: 15000,
  KG2: 15000,
  "Grade 1": 18000,
  "Grade 2": 18000,
  "Grade 3": 18000,
  "Grade 4": 18000,
  "Grade 5": 18000,
  "Grade 6": 18000,
  "Grade 7": 22000,
  "Grade 8": 22000,
  "Grade 9": 22000,
  "Grade 10": 28000,
  "Grade 11": 28000,
  "Grade 12": 28000,
}

// Payment methods distribution
const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CHEQUE",
  "CREDIT_CARD",
  "DEBIT_CARD",
] as const

// Fine types for students
const FINE_REASONS = [
  {
    type: "LATE_FEE",
    reason: "Late payment penalty",
    minAmount: 100,
    maxAmount: 500,
  },
  {
    type: "LIBRARY_FINE",
    reason: "Overdue library book",
    minAmount: 50,
    maxAmount: 200,
  },
  {
    type: "DISCIPLINE_FINE",
    reason: "Classroom disruption",
    minAmount: 100,
    maxAmount: 300,
  },
  {
    type: "DAMAGE_FINE",
    reason: "School property damage",
    minAmount: 200,
    maxAmount: 1000,
  },
] as const

// Scholarship types
const SCHOLARSHIPS = [
  {
    name: "Merit Scholarship",
    description: "For students with outstanding academic performance",
    coverageType: "PERCENTAGE",
    coverageAmount: 50,
    minPercentage: 90,
  },
  {
    name: "Financial Aid",
    description: "For families demonstrating financial need",
    coverageType: "PERCENTAGE",
    coverageAmount: 75,
    maxFamilyIncome: 50000,
  },
  {
    name: "Sports Excellence",
    description: "For students excelling in athletics",
    coverageType: "PERCENTAGE",
    coverageAmount: 25,
  },
  {
    name: "Full Scholarship",
    description: "Complete tuition waiver for exceptional cases",
    coverageType: "FULL",
    coverageAmount: 100,
  },
] as const

// ============================================================================
// FEE STRUCTURE SEEDING
// ============================================================================

/**
 * Seed fee structures for both academic years
 */
export async function seedFeeStructures(
  prisma: PrismaClient,
  schoolId: string
): Promise<Map<string, Map<string, string>>> {
  logPhase(10, "FEES & INVOICES", "الرسوم والفواتير")

  // Map: academicYear -> levelName -> feeStructureId
  const feeStructureMap = new Map<string, Map<string, string>>()
  let count = 0

  const academicYears = ["2024-2025", "2025-2026"]

  for (const academicYear of academicYears) {
    const yearMap = new Map<string, string>()

    for (const structure of FEE_STRUCTURES) {
      try {
        // Calculate total fee
        const totalAmount =
          (structure.tuitionFee || 0) +
          (structure.registrationFee || 0) +
          (structure.examFee || 0) +
          (structure.libraryFee || 0) +
          (structure.laboratoryFee || 0) +
          (structure.sportsFee || 0) +
          (structure.transportFee || 0)

        // Check if fee structure exists
        const existing = await prisma.feeStructure.findFirst({
          where: {
            schoolId,
            name: structure.name,
            academicYear,
          },
        })

        let feeStructure
        if (existing) {
          feeStructure = existing
        } else {
          feeStructure = await prisma.feeStructure.create({
            data: {
              schoolId,
              name: structure.name,
              academicYear,
              description: structure.description,
              tuitionFee: structure.tuitionFee,
              registrationFee: structure.registrationFee || 0,
              examFee: structure.examFee || 0,
              libraryFee: structure.libraryFee || 0,
              laboratoryFee: structure.laboratoryFee || 0,
              sportsFee: structure.sportsFee || 0,
              transportFee: structure.transportFee || 0,
              totalAmount,
              lateFeeAmount: 200,
              lateFeeType: "FIXED",
              isActive: academicYear === "2025-2026",
            },
          })
          count++
        }

        // Map each level to this fee structure
        for (const levelName of structure.levels) {
          yearMap.set(levelName, feeStructure.id)
        }
      } catch {
        // Skip if fee structure already exists
      }
    }

    feeStructureMap.set(academicYear, yearMap)
  }

  logSuccess("Fee Structures", count, "for 2 academic years")

  return feeStructureMap
}

// ============================================================================
// FEE ASSIGNMENTS WITH 2-YEAR HISTORY
// ============================================================================

/**
 * Seed fee assignments for students (both years)
 * - 2024-2025: All PAID (historical)
 * - 2025-2026: Mixed status (75% PAID, 15% PARTIAL, 10% PENDING)
 */
export async function seedFeeAssignments(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  yearLevels: YearLevelRef[],
  feeStructureMap: Map<string, Map<string, string>>
): Promise<{ assignmentIds: string[]; totalCount: number }> {
  const assignmentIds: string[] = []
  let recordCount = 0

  const academicYears = ["2024-2025", "2025-2026"]

  for (const academicYear of academicYears) {
    const yearMap = feeStructureMap.get(academicYear)
    if (!yearMap) continue

    await processBatch(students, 100, async (student) => {
      if (!student.yearLevelId) return

      const yearLevel = yearLevels.find((yl) => yl.id === student.yearLevelId)
      if (!yearLevel) return

      const feeStructureId = yearMap.get(yearLevel.levelName)
      if (!feeStructureId) return

      const amount = FEE_AMOUNTS[yearLevel.levelName] || 20000

      // Determine status based on year
      let status: "PENDING" | "PARTIAL" | "PAID"
      if (academicYear === "2024-2025") {
        // Historical year: all paid
        status = "PAID"
      } else {
        // Current year: mixed distribution
        const rand = Math.random()
        if (rand < 0.75) status = "PAID"
        else if (rand < 0.9) status = "PARTIAL"
        else status = "PENDING"
      }

      try {
        const assignment = await prisma.feeAssignment.upsert({
          where: {
            studentId_feeStructureId_academicYear: {
              studentId: student.id,
              feeStructureId,
              academicYear,
            },
          },
          update: {
            finalAmount: amount,
            status,
          },
          create: {
            schoolId,
            studentId: student.id,
            feeStructureId,
            academicYear,
            finalAmount: amount,
            status,
          },
        })
        assignmentIds.push(assignment.id)
        recordCount++
      } catch {
        // Skip if record already exists
      }
    })
  }

  logSuccess("Fee Assignments", recordCount, "across 2 academic years")

  return { assignmentIds, totalCount: recordCount }
}

// ============================================================================
// PAYMENT RECORDS
// ============================================================================

let paymentCounter = 0
let receiptCounter = 0

/**
 * Generate unique payment number
 */
function generatePaymentNumber(): string {
  paymentCounter++
  return `PAY-${Date.now()}-${paymentCounter.toString().padStart(5, "0")}`
}

/**
 * Generate unique receipt number
 */
function generateReceiptNumber(): string {
  receiptCounter++
  return `RCP-${Date.now()}-${receiptCounter.toString().padStart(5, "0")}`
}

/**
 * Seed payment records for fee assignments
 * Target: ~500 payments
 */
export async function seedPayments(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  let paymentCount = 0

  // Get all fee assignments that are PAID or PARTIAL
  const feeAssignments = await prisma.feeAssignment.findMany({
    where: {
      schoolId,
      status: { in: ["PAID", "PARTIAL"] },
    },
    select: {
      id: true,
      studentId: true,
      finalAmount: true,
      status: true,
      academicYear: true,
    },
    take: 600, // Process enough to get ~500 payments
  })

  await processBatch(feeAssignments, 50, async (assignment) => {
    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        schoolId,
        feeAssignmentId: assignment.id,
      },
    })

    if (existingPayment) return

    const finalAmount = Number(assignment.finalAmount)

    // Calculate payment amount based on status
    let paymentAmount: number
    if (assignment.status === "PAID") {
      paymentAmount = finalAmount
    } else {
      // PARTIAL: pay 30-70% of the amount
      const percentage = randomNumber(30, 70) / 100
      paymentAmount = Math.round(finalAmount * percentage)
    }

    // Determine payment date based on academic year
    let paymentDate: Date
    if (assignment.academicYear === "2024-2025") {
      // Historical: random date in 2024
      const month = randomNumber(1, 12)
      const day = randomNumber(1, 28)
      paymentDate = new Date(2024, month - 1, day)
    } else {
      // Current year: September 2025 to now
      const month = randomNumber(9, 12)
      const day = randomNumber(1, 28)
      paymentDate = new Date(2025, month - 1, day)
    }

    try {
      await prisma.payment.create({
        data: {
          schoolId,
          feeAssignmentId: assignment.id,
          studentId: assignment.studentId,
          paymentNumber: generatePaymentNumber(),
          amount: paymentAmount,
          paymentDate,
          paymentMethod: randomElement(PAYMENT_METHODS),
          receiptNumber: generateReceiptNumber(),
          status: "SUCCESS",
          remarks:
            assignment.status === "PARTIAL"
              ? "Partial payment received"
              : "Full payment received",
        },
      })
      paymentCount++
    } catch {
      // Skip if payment fails
    }
  })

  logSuccess("Payments", paymentCount, "with receipts generated")

  return paymentCount
}

// ============================================================================
// FINES
// ============================================================================

/**
 * Seed fines for 10% of students
 * Target: ~100 fines
 */
export async function seedFines(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  let fineCount = 0

  // Select 10% of students for fines
  const studentsWithFines = students
    .filter(() => Math.random() < 0.1)
    .slice(0, 100)

  await processBatch(studentsWithFines, 20, async (student) => {
    const fineConfig = randomElement(FINE_REASONS)
    const amount = randomNumber(fineConfig.minAmount, fineConfig.maxAmount)

    // 60% of fines are paid
    const isPaid = Math.random() < 0.6

    // Due date: sometime in the current term
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + randomNumber(7, 60))

    try {
      // Check if fine already exists for this student and type
      const existing = await prisma.fine.findFirst({
        where: {
          schoolId,
          studentId: student.id,
          fineType: fineConfig.type,
        },
      })

      if (!existing) {
        await prisma.fine.create({
          data: {
            schoolId,
            studentId: student.id,
            fineType: fineConfig.type,
            amount,
            reason: fineConfig.reason,
            dueDate,
            isPaid,
            paidAmount: isPaid ? amount : null,
            paidDate: isPaid ? new Date() : null,
          },
        })
        fineCount++
      }
    } catch {
      // Skip if fine creation fails
    }
  })

  logSuccess("Fines", fineCount, "assigned to students")

  return fineCount
}

// ============================================================================
// SCHOLARSHIPS
// ============================================================================

let scholarshipAppCounter = 0

/**
 * Generate unique scholarship application number
 */
function generateApplicationNumber(): string {
  scholarshipAppCounter++
  return `SCH-APP-${Date.now()}-${scholarshipAppCounter.toString().padStart(4, "0")}`
}

/**
 * Seed scholarships and applications
 * Target: ~50 scholarship applications
 */
export async function seedScholarships(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  let applicationCount = 0

  // Create scholarship programs
  const scholarshipIds: string[] = []

  for (const scholarship of SCHOLARSHIPS) {
    try {
      const existing = await prisma.scholarship.findFirst({
        where: {
          schoolId,
          name: scholarship.name,
          academicYear: "2025-2026",
        },
      })

      if (existing) {
        scholarshipIds.push(existing.id)
      } else {
        const created = await prisma.scholarship.create({
          data: {
            schoolId,
            name: scholarship.name,
            description: scholarship.description,
            coverageType: scholarship.coverageType as "PERCENTAGE" | "FULL",
            coverageAmount: scholarship.coverageAmount,
            minPercentage:
              "minPercentage" in scholarship
                ? scholarship.minPercentage
                : undefined,
            maxFamilyIncome:
              "maxFamilyIncome" in scholarship
                ? scholarship.maxFamilyIncome
                : undefined,
            academicYear: "2025-2026",
            startDate: new Date("2025-09-01"),
            endDate: new Date("2026-06-30"),
            maxBeneficiaries: 20,
            isActive: true,
          },
        })
        scholarshipIds.push(created.id)
      }
    } catch {
      // Skip if scholarship creation fails
    }
  }

  logSuccess("Scholarships", scholarshipIds.length, "programs created")

  // Select ~50 students for scholarship applications
  const applicants = students.filter(() => Math.random() < 0.05).slice(0, 50)

  const applicationStatuses = [
    "PENDING",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
  ] as const

  await processBatch(applicants, 10, async (student) => {
    const scholarshipId = randomElement(scholarshipIds)
    if (!scholarshipId) return

    const status = randomElement(applicationStatuses)

    try {
      // Check if application already exists
      const existing = await prisma.scholarshipApplication.findFirst({
        where: {
          schoolId,
          studentId: student.id,
          scholarshipId,
          academicYear: "2025-2026",
        },
      })

      if (!existing) {
        await prisma.scholarshipApplication.create({
          data: {
            schoolId,
            studentId: student.id,
            scholarshipId,
            applicationNumber: generateApplicationNumber(),
            applicationDate: new Date(),
            academicYear: "2025-2026",
            familyIncome: randomNumber(20000, 100000),
            statement:
              "Application for financial assistance for the academic year.",
            status,
            reviewDate: status !== "PENDING" ? new Date() : null,
            awardedAmount:
              status === "APPROVED" ? randomNumber(5000, 15000) : null,
            awardDate: status === "APPROVED" ? new Date() : null,
          },
        })
        applicationCount++
      }
    } catch {
      // Skip if application creation fails
    }
  })

  logSuccess("Scholarship Applications", applicationCount, "submitted")

  return applicationCount
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

/**
 * Seed all fee-related data
 * - Fee structures for 2 years
 * - Fee assignments for all students (2 years)
 * - ~500 payment records
 * - ~100 fines
 * - ~50 scholarship applications
 */
export async function seedFees(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  yearLevels: YearLevelRef[]
): Promise<number> {
  // Reset counters
  paymentCounter = 0
  receiptCounter = 0
  scholarshipAppCounter = 0

  // 1. Seed fee structures for both years
  const feeStructureMap = await seedFeeStructures(prisma, schoolId)

  // 2. Seed fee assignments
  const { totalCount } = await seedFeeAssignments(
    prisma,
    schoolId,
    students,
    yearLevels,
    feeStructureMap
  )

  // 3. Seed payments
  await seedPayments(prisma, schoolId, students)

  // 4. Seed fines
  await seedFines(prisma, schoolId, students)

  // 5. Seed scholarships and applications
  await seedScholarships(prisma, schoolId, students)

  return totalCount
}
