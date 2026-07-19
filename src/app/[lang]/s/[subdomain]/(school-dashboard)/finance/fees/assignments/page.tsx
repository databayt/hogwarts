// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { type FeeAssignmentRow } from "@/components/school-dashboard/finance/fees/assignment-columns"
import { FeeAssignmentsTable } from "@/components/school-dashboard/finance/fees/assignment-table"
import { getFeeAssignmentList } from "@/components/school-dashboard/finance/fees/queries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.fees?.myFees?.feeAssignments || "Fee Assignments",
  }
}

export default async function FeeAssignmentsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  const { rows, count } = await getFeeAssignmentList(schoolId, {
    page: 1,
    perPage: 20,
  })

  const data: FeeAssignmentRow[] = rows.map((fa: any) => ({
    id: fa.id,
    studentName: [fa.student?.firstName, fa.student?.lastName]
      .filter(Boolean)
      .join(" "),
    studentId: fa.studentId,
    feeStructureName: fa.feeStructure?.name || "-",
    academicYear: fa.academicYear,
    finalAmount: Number(fa.finalAmount),
    totalDiscount: Number(fa.totalDiscount),
    paidAmount: (fa.payments ?? [])
      .filter((p: any) => p.status === "SUCCESS")
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
    status: fa.status,
    createdAt:
      fa.createdAt instanceof Date
        ? fa.createdAt.toISOString()
        : String(fa.createdAt),
  }))

  return <FeeAssignmentsTable initialData={data} total={count} lang={lang} />
}
