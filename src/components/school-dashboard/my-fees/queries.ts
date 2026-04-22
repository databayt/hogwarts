// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

export interface MyFeesStudent {
  id: string
  firstName: string
  lastName: string
  preferredPaymentMethod: string | null
  academicGradeId: string | null
}

/**
 * Resolve the set of students the signed-in user has billing access to.
 * - STUDENT role: their own Student row (via Student.userId)
 * - GUARDIAN role: all linked Student rows via StudentGuardian (via Guardian.userId)
 */
export async function getBillingStudentsForUser(
  userId: string,
  schoolId: string
): Promise<MyFeesStudent[]> {
  // STUDENT path — direct self-link
  const selfStudent = await db.student.findFirst({
    where: { userId, schoolId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredPaymentMethod: true,
      academicGradeId: true,
    },
  })
  if (selfStudent) return [selfStudent]

  // GUARDIAN path — via Guardian.userId → StudentGuardian → Student
  const guardian = await db.guardian.findFirst({
    where: { userId, schoolId },
    select: {
      studentGuardians: {
        select: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              preferredPaymentMethod: true,
              academicGradeId: true,
            },
          },
        },
      },
    },
  })

  return guardian?.studentGuardians.map((sg) => sg.student) ?? []
}

export interface MyFeeAssignment {
  id: string
  feeStructureName: string
  academicYear: string
  totalAmount: number
  totalDiscount: number
  finalAmount: number
  status: string
  discounts: Array<{ type: string; amount: number; reason?: string }>
}

export async function getAssignmentsForStudents(
  schoolId: string,
  studentIds: string[]
): Promise<Record<string, MyFeeAssignment[]>> {
  if (studentIds.length === 0) return {}

  const rows = await db.feeAssignment.findMany({
    where: { schoolId, studentId: { in: studentIds } },
    include: {
      feeStructure: { select: { name: true, totalAmount: true } },
    },
    orderBy: [{ academicYear: "desc" }, { createdAt: "asc" }],
  })

  const grouped: Record<string, MyFeeAssignment[]> = {}
  for (const row of rows) {
    const list = grouped[row.studentId] ?? []
    list.push({
      id: row.id,
      feeStructureName: row.feeStructure.name,
      academicYear: row.academicYear,
      totalAmount: Number(row.feeStructure.totalAmount),
      totalDiscount: Number(row.totalDiscount),
      finalAmount: Number(row.finalAmount),
      status: row.status,
      discounts:
        (row.discounts as Array<{
          type: string
          amount: number
          reason?: string
        }> | null) ?? [],
    })
    grouped[row.studentId] = list
  }
  return grouped
}
