"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

export async function getSchoolGrades(schoolId: string) {
  return db.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, name: true, gradeNumber: true },
    orderBy: { gradeNumber: "asc" },
  })
}

export async function getSchoolSubjects(schoolId: string) {
  const selections = await db.schoolSubjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: { subject: { select: { id: true, name: true } } },
    distinct: ["catalogSubjectId"],
  })
  return selections.map((s) => ({ id: s.subject.id, name: s.subject.name }))
}

export async function getSchoolDepartments(schoolId: string) {
  return db.department.findMany({
    where: { schoolId },
    select: { id: true, departmentName: true },
    orderBy: { departmentName: "asc" },
  })
}
