// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DashboardContent } from "@/components/saas-dashboard/dashboard/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Overview",
  description: "Platform overview",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Dashboard({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.dashboard?.title || "Overview"} />
      <DashboardContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
