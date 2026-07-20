// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { SHOWN_FEATURES } from "@/components/saas-marketing/features/constants"
import FeatureDetails from "@/components/saas-marketing/features/details"
import { localizeFeature } from "@/components/saas-marketing/features/i18n"

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params
  const feature = SHOWN_FEATURES.find((f) => f.id === id)
  if (!feature) {
    return {
      title: lang === "ar" ? "الميزة غير موجودة" : "Feature Not Found",
    }
  }
  const localized = localizeFeature(feature, lang)
  return {
    title: `${localized.title} — ${lang === "ar" ? "المميزات" : "Features"}`,
    description: localized.description,
  }
}

export default async function Feature({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return <FeatureDetails dictionary={dictionary} lang={lang} id={id} />
}
