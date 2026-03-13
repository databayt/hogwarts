// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type FineRow } from "@/components/school-dashboard/finance/fees/fine-columns"
import { FinesTable } from "@/components/school-dashboard/finance/fees/fine-table"
import { getFineList } from "@/components/school-dashboard/finance/fees/queries"

export const metadata = { title: "Fines & Penalties" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function FinesPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const { rows, count } = await getFineList(schoolId, {
    page: 1,
    perPage: 20,
  })

  const data: FineRow[] = rows.map((f: any) => ({
    id: f.id,
    studentName: [f.student?.givenName, f.student?.surname]
      .filter(Boolean)
      .join(" "),
    studentId: f.studentId,
    fineType: f.fineType,
    amount: Number(f.amount),
    reason: f.reason,
    dueDate:
      f.dueDate instanceof Date ? f.dueDate.toISOString() : String(f.dueDate),
    isPaid: f.isPaid,
    isWaived: f.isWaived,
    createdAt:
      f.createdAt instanceof Date
        ? f.createdAt.toISOString()
        : String(f.createdAt),
  }))

  return <FinesTable initialData={data} total={count} lang={lang} />
}
