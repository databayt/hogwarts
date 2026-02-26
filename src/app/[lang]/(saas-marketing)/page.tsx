// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import MarketingContent from "@/components/saas-marketing/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Home({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <MarketingContent dictionary={dictionary} lang={lang} />
}
