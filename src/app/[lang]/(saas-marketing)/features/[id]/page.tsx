// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FEATURES } from "@/components/saas-marketing/features/constants"
import FeatureDetails from "@/components/saas-marketing/features/details"
import { localizeFeature } from "@/components/saas-marketing/features/i18n"

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

// Every feature page is prerendered per locale at build time (the locale
// comes from the root layout's generateStaticParams): the detail pages are
// pure content, so a visitor gets static HTML instead of a server render.
// That means all of FEATURES, not only the modules the /features grid shows:
// planned modules are still linked from Related Features, and a page rendered
// on demand returns a bare 500 inside the production container (2026-11-09).
// Any other id is a plain 404.
export const dynamicParams = false

export function generateStaticParams() {
  return FEATURES.map((feature) => ({ id: feature.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params
  const feature = FEATURES.find((f) => f.id === id)
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
