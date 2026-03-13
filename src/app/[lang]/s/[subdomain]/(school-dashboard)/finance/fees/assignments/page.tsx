// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type FeeAssignmentRow } from "@/components/school-dashboard/finance/fees/assignment-columns"
import { FeeAssignmentsTable } from "@/components/school-dashboard/finance/fees/assignment-table"
import { getFeeAssignmentList } from "@/components/school-dashboard/finance/fees/queries"

export const metadata = { title: "Fee Assignments" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function FeeAssignmentsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const { rows, count } = await getFeeAssignmentList(schoolId, {
    page: 1,
    perPage: 20,
  })

  const data: FeeAssignmentRow[] = rows.map((fa: any) => ({
    id: fa.id,
    studentName: [fa.student?.givenName, fa.student?.surname]
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
