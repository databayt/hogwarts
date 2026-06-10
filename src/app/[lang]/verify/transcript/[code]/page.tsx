// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TranscriptVerifyContent } from "@/components/school-dashboard/grades/transcripts/verify-content"

// Keep this standalone public route out of build-time page-data collection
// (documented page-data OOM trigger). Renders on demand.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Transcript verification",
  description: "Confirm the authenticity of a school-issued transcript",
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ lang: Locale; code: string }>
}

export default async function TranscriptVerifyPage({ params }: Props) {
  const { lang, code } = await params
  const dictionary = await getDictionary(lang)
  return (
    <TranscriptVerifyContent code={code} lang={lang} dictionary={dictionary} />
  )
}
