// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import FeatureDetails from "@/components/saas-marketing/features/details"

export const metadata = {
  title: "Feature Details",
}

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function Feature({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return <FeatureDetails dictionary={dictionary} lang={lang} id={id} />
}
