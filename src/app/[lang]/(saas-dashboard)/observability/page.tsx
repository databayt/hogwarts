// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ObservabilityContent } from "@/components/saas-dashboard/observability/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: b?.observability || "Observability",
    description: "System logs and audit trails",
  }
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

  const n = d?.nav as { logs?: string; conference?: string } | undefined
  const observabilityPages: PageNavItem[] = [
    { name: n?.logs || "Logs", href: `/${lang}/observability` },
    {
      name: n?.conference || "Conference",
      href: `/${lang}/observability/conference`,
    },
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
