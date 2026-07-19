// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getScholarshipList } from "@/components/school-dashboard/finance/fees/queries"
import { type ScholarshipRow } from "@/components/school-dashboard/finance/fees/scholarship-columns"
import { ScholarshipsTable } from "@/components/school-dashboard/finance/fees/scholarship-table"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.finance?.feesPage?.scholarships || "Scholarships",
  }
}

export default async function ScholarshipsPage({ params }: Props) {
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

  const { rows, count } = await getScholarshipList(schoolId, {
    page: 1,
    perPage: 20,
  })

  const data: ScholarshipRow[] = rows.map((s: any) => ({
    id: s.id,
    name: s.name,
    coverageType: s.coverageType,
    coverageAmount: Number(s.coverageAmount),
    academicYear: s.academicYear,
    startDate:
      s.startDate instanceof Date
        ? s.startDate.toISOString()
        : String(s.startDate),
    endDate:
      s.endDate instanceof Date ? s.endDate.toISOString() : String(s.endDate),
    maxBeneficiaries: s.maxBeneficiaries,
    currentBeneficiaries: s.currentBeneficiaries,
    applicationCount: s._count?.applications || 0,
    isActive: s.isActive,
    createdAt:
      s.createdAt instanceof Date
        ? s.createdAt.toISOString()
        : String(s.createdAt),
  }))

  return <ScholarshipsTable initialData={data} total={count} lang={lang} />
}
