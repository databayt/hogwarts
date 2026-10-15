// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ReportCardsContent } from "@/components/school-dashboard/reports/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{ termId?: string; page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary.school.grades.navReports }
}

/**
 * Report cards for a term: generate (whole school, a grade or a section),
 * publish — which notifies students and guardians — then view or download
 * each card, as PDF or filled from the school's own .docx template.
 */
export default async function ReportCardsPage({ params, searchParams }: Props) {
  const { lang } = await params
  const { termId, page } = await searchParams
  const dictionary = await getDictionary(lang)

  return (
    <div className="flex flex-col gap-4 max-md:min-w-0">
      <ReportCardsContent
        locale={lang}
        dictionary={dictionary}
        termId={termId}
        page={Number(page) || 1}
      />
    </div>
  )
}
