// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { type FeeStructureRow } from "@/components/school-dashboard/finance/fees/columns"
import { getFeeStructureList } from "@/components/school-dashboard/finance/fees/queries"
import { FeeStructuresTable } from "@/components/school-dashboard/finance/fees/table"

export const metadata = { title: "Fee Structures" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FeeStructuresPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const { rows, count } = await getFeeStructureList(schoolId, {
    page: 1,
    perPage: 20,
  })

  // Map to serializable row type
  const data: FeeStructureRow[] = rows.map((fs) => ({
    id: fs.id,
    name: fs.name,
    academicYear: fs.academicYear,
    className: fs.class?.name || null,
    totalAmount: Number(fs.totalAmount),
    installments: fs.installments,
    assignmentCount: fs._count?.feeAssignments || 0,
    isActive: fs.isActive,
    createdAt: fs.createdAt.toISOString(),
  }))

  return <FeeStructuresTable initialData={data} total={count} lang={lang} />
}
