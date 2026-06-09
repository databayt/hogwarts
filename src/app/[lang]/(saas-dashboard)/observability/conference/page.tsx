// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConferenceObservabilityContent } from "@/components/saas-dashboard/observability/conference/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Conference observability",
  description: "Live rooms, recordings, and TURN fallback across schools",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function ConferenceObservability({ params }: Props) {
  const { lang } = await params
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
      <ConferenceObservabilityContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
