// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ChildOverviewContent } from "@/components/school-dashboard/parent-portal/child/overview-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ChildOverviewPage({ params }: Props) {
  const { id, lang } = await params
  const dictionary = await getDictionary(lang)
  return (
    <ChildOverviewContent studentId={id} lang={lang} dictionary={dictionary} />
  )
}
