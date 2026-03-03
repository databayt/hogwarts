// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { ReportCardsTable } from "./table"

export async function ReportCardsContent() {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  // Fetch available terms for filter
  const terms = await db.term.findMany({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: { id: true, termNumber: true },
    take: 10,
  })

  // Fetch available grades for filter
  const grades = await db.academicGrade.findMany({
    where: { schoolId },
    orderBy: { gradeNumber: "asc" },
    select: { id: true, name: true, gradeNumber: true },
  })

  // Get the most recent term
  const latestTerm = terms[0]

  // Fetch initial report cards
  const initialData = latestTerm
    ? await db.reportCard.findMany({
        where: { schoolId, termId: latestTerm.id },
        include: {
          student: {
            select: {
              id: true,
              givenName: true,
              surname: true,
              studentId: true,
            },
          },
          grades: {
            include: { subject: { select: { subjectName: true } } },
          },
        },
        orderBy: { rank: "asc" },
        take: 20,
      })
    : []

  const total = latestTerm
    ? await db.reportCard.count({ where: { schoolId, termId: latestTerm.id } })
    : 0

  return (
    <ReportCardsTable
      initialData={initialData}
      total={total}
      terms={terms}
      grades={grades}
      defaultTermId={latestTerm?.id}
    />
  )
}
