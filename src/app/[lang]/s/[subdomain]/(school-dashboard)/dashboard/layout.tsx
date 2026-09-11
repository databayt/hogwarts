// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function DashboardLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.dashboard

  return (
    <div className="space-y-6">
      {/* `heading` is the on-page h1 only — the tab title stays `title`.
          It is hidden on phones: below `md` the dashboard opens with the home
          block ported from the Android app, which carries no page title. */}
      <PageHeadingSetter
        title={d?.heading || d?.title || "Overview"}
        hideOnMobile
      />
      {children}
    </div>
  )
}
