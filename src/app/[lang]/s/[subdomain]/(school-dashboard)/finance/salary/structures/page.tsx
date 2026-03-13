// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type SalaryStructureRow } from "@/components/school-dashboard/finance/salary/columns"
import { getSalaryStructureList } from "@/components/school-dashboard/finance/salary/queries"
import { SalaryStructuresTable } from "@/components/school-dashboard/finance/salary/table"

export const metadata = { title: "Salary Structures" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function SalaryStructuresPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const { rows, count } = await getSalaryStructureList(schoolId, {
    page: 1,
    perPage: 20,
  })

  const data: SalaryStructureRow[] = rows.map((s: any) => ({
    id: s.id,
    teacherName: [s.teacher?.givenName, s.teacher?.surname]
      .filter(Boolean)
      .join(" "),
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
