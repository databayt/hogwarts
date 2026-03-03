// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { ReportCardsContent } from "@/components/school-dashboard/reports/content"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "Report Cards" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{ termId?: string }>
}

export default async function ReportCardsPage({ params, searchParams }: Props) {
  const { lang } = await params
  const { termId } = await searchParams
  const dictionary = await getDictionary(lang)

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter title="Report Cards" />
        <ReportCardsContent
          locale={lang}
          dictionary={dictionary}
          termId={termId}
        />
      </div>
    </PageContainer>
  )
}
