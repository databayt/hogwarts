// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { FeeAssignmentForm } from "@/components/school-dashboard/finance/fees/assignment-form"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import { getLabels } from "@/components/translation/person"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.finance?.assignmentForm?.assignFee || "Assign Fee",
  }
}

export default async function AssignFeePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  // No student list up front: a structure for a grade loads that grade's
  // students, and the picker searches the rest of the school on demand.
  const feeStructures = await db.feeStructure.findMany({
    where: { schoolId, isActive: true },
    select: {
      id: true,
      name: true,
      totalAmount: true,
      gradeId: true,
      grade: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  })
  const labels = await getLabels(
    feeStructures.flatMap((fs) => [fs.name, fs.grade?.name]),
    lang,
    schoolId
  )
  const serializedFeeStructures = feeStructures.map((fs) => ({
    id: fs.id,
    name: labels.get(fs.name) ?? fs.name,
    totalAmount: Number(fs.totalAmount),
    gradeId: fs.gradeId,
    gradeName: fs.grade?.name
      ? (labels.get(fs.grade.name) ?? fs.grade.name)
      : null,
  }))

  return (
    <FeeAssignmentForm lang={lang} feeStructures={serializedFeeStructures} />
  )
}
