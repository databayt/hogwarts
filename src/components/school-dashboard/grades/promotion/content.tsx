// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getPromotionBatches } from "../actions/promotion"
import { PromotionDashboard } from "./dashboard"

export async function PromotionContent() {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  const [batches, years, grades] = await Promise.all([
    getPromotionBatches(),
    db.schoolYear.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
      select: { id: true, yearName: true },
      take: 5,
    }),
    db.academicGrade.findMany({
      where: { schoolId },
      orderBy: { gradeNumber: "asc" },
      select: { id: true, name: true, gradeNumber: true },
    }),
  ])

  return <PromotionDashboard batches={batches} years={years} grades={grades} />
}
