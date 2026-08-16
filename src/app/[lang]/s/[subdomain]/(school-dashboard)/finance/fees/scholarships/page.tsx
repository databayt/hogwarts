// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { getScholarshipList } from "@/components/school-dashboard/finance/fees/queries"
import { toScholarshipRows } from "@/components/school-dashboard/finance/fees/rows"
import { ScholarshipsTable } from "@/components/school-dashboard/finance/fees/scholarship-table"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

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

  const { rows, count } = await getScholarshipList(schoolId, {
    page: 1,
    perPage: 20,
  })

  const data = await toScholarshipRows(rows, lang, schoolId)

  return <ScholarshipsTable initialData={data} total={count} lang={lang} />
}
