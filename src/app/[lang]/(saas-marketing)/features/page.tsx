// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import Content from "@/components/saas-marketing/features/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary.marketing.features

  return {
    title: lang === "ar" ? `المميزات — ${t.title}` : `Features — ${t.title}`,
    description: t.subtitle,
  }
}

export default async function Features({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <Content dictionary={dictionary} params={{ lang }} />
}
