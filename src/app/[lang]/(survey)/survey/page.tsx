// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import SurveyContent from "@/components/saas-marketing/survey/content"
import { getSurveyDictionary } from "@/components/saas-marketing/survey/dictionary"

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const { meta } = await getSurveyDictionary(lang)
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
  }
}

// Full-screen on purpose: its own route group, no marketing header/footer —
// the flow owns the whole viewport (h-dvh) and flips between questions.
export default async function SurveyPage({ params }: Props) {
  const { lang } = await params
  return <SurveyContent lang={lang} />
}
