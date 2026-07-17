// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import { type SalaryStructureRow } from "@/components/school-dashboard/finance/salary/columns"
import { getSalaryStructureList } from "@/components/school-dashboard/finance/salary/queries"
import { SalaryStructuresTable } from "@/components/school-dashboard/finance/salary/table"
import { getLabels } from "@/components/translation/person"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.salaryPage?.salaryStructures }
}

export default async function SalaryStructuresPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId, can } = await resolveFinanceAccess("salary", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="salary" />
  }

  const { rows, count } = await getSalaryStructureList(schoolId, {
    page: 1,
    perPage: 20,
  })

  // One batched, deduped resolution for teacher names (no per-row N+1)
  const teacherNames = rows.map((s: any) =>
    [s.teacher?.firstName, s.teacher?.lastName].filter(Boolean).join(" ")
  )
  const labels = await getLabels(teacherNames, lang, schoolId)
  const data: SalaryStructureRow[] = rows.map((s: any, i: number) => ({
    id: s.id,
    teacherName: labels.get(teacherNames[i]) ?? teacherNames[i],
    teacherId: s.teacherId,
    employeeId: s.teacher?.employeeId || null,
    baseSalary: Number(s.baseSalary),
    currency: s.currency,
    payFrequency: s.payFrequency,
    allowanceCount: s._count?.allowances || 0,
    deductionCount: s._count?.deductions || 0,
    isActive: s.isActive,
    effectiveFrom:
      s.effectiveFrom instanceof Date
        ? s.effectiveFrom.toISOString()
        : String(s.effectiveFrom),
    createdAt:
      s.createdAt instanceof Date
        ? s.createdAt.toISOString()
        : String(s.createdAt),
  }))

  return <SalaryStructuresTable initialData={data} total={count} lang={lang} />
}
