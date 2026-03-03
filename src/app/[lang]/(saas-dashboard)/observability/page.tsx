// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ObservabilityContent } from "@/components/saas-dashboard/observability/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Observability",
  description: "System logs and audit trails",
}

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{
    page?: string
    limit?: string
    action?: string
    search?: string
  }>
}

export default async function Observability({ params, searchParams }: Props) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const observabilityPages: PageNavItem[] = [
    { name: n?.logs || "Logs", href: `/${lang}/observability` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.observability?.title || "Observability"} />
      <PageNav pages={observabilityPages} />
      <ObservabilityContent
        dictionary={dictionary}
        lang={lang}
        searchParams={resolvedSearchParams}
      />
    </div>
  )
}
