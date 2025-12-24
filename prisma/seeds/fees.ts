/**
 * Fees Seed
 * Creates Fee Structures and Fee Assignments
 *
 * Phase 10: Fees & Invoices
 *
 * Note: FeeStructure has no unique constraint, using findFirst + create
 * FeeAssignment has @@unique([studentId, feeStructureId, academicYear])
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef, YearLevelRef } from "./types"
import { logPhase, logSuccess, processBatch } from "./utils"

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

// ============================================================================
// FEE SEEDING
// ============================================================================

/**
 * Seed fee structures (one per level group)
 * Note: FeeStructure has no unique constraint, using findFirst + create
 */
export async function seedFeeStructures(
  prisma: PrismaClient,
  schoolId: string
): Promise<Map<string, string>> {
  logPhase(10, "FEES & INVOICES", "الرسوم والفواتير")

  const feeStructureMap = new Map<string, string>() // levelName -> feeStructureId
  let count = 0

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

      // Check if fee structure exists (no unique constraint)
      const existing = await prisma.feeStructure.findFirst({
        where: {
          schoolId,
          name: structure.name,
          academicYear: "2025-2026",
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
            academicYear: "2025-2026",
            description: structure.description,
            tuitionFee: structure.tuitionFee,
            registrationFee: structure.registrationFee || 0,
            examFee: structure.examFee || 0,
            libraryFee: structure.libraryFee || 0,
            laboratoryFee: structure.laboratoryFee || 0,
            sportsFee: structure.sportsFee || 0,
            transportFee: structure.transportFee || 0,
            totalAmount,
            isActive: true,
          },
        })
        count++
      }

      // Map each level to this fee structure
      for (const levelName of structure.levels) {
        feeStructureMap.set(levelName, feeStructure.id)
      }
    } catch {
      // Skip if fee structure already exists with different key
    }
  }

  logSuccess("Fee Structures", count, "by level group")

  return feeStructureMap
}

/**
 * Seed fee assignments for students
 * Note: FeeAssignment has @@unique([studentId, feeStructureId, academicYear])
 */
export async function seedFeeAssignments(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  yearLevels: YearLevelRef[],
  feeStructureMap: Map<string, string>
): Promise<number> {
  let recordCount = 0

  // Get fee amounts by level
  const feeAmounts: Record<string, number> = {
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

  await processBatch(students, 100, async (student) => {
    if (!student.yearLevelId) return

    const yearLevel = yearLevels.find((yl) => yl.id === student.yearLevelId)
    if (!yearLevel) return

    const feeStructureId = feeStructureMap.get(yearLevel.levelName)
    if (!feeStructureId) return

    const amount = feeAmounts[yearLevel.levelName] || 20000

    // Create fee assignment for each student
    try {
      await prisma.feeAssignment.upsert({
        where: {
          studentId_feeStructureId_academicYear: {
            studentId: student.id,
            feeStructureId,
            academicYear: "2025-2026",
          },
        },
        update: {
          finalAmount: amount,
        },
        create: {
          schoolId,
          studentId: student.id,
          feeStructureId,
          academicYear: "2025-2026",
          finalAmount: amount,
          status: "PENDING",
        },
      })
      recordCount++
    } catch {
      // Skip if record already exists
    }
  })

  logSuccess("Fee Assignments", recordCount, "tuition fees assigned")

  return recordCount
}

/**
 * Seed all fee-related data
 */
export async function seedFees(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  yearLevels: YearLevelRef[]
): Promise<number> {
  const feeStructureMap = await seedFeeStructures(prisma, schoolId)
  return await seedFeeAssignments(
    prisma,
    schoolId,
    students,
    yearLevels,
    feeStructureMap
  )
}
