// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"

import { getSurveyDictionary } from "./dictionary"
import { SurveyFlow } from "./flow"

interface Props {
  lang: Locale
}

export default async function SurveyContent({ lang }: Props) {
  const dictionary = await getSurveyDictionary(lang)
  return (
    <SurveyFlow
      dictionary={dictionary}
      lang={lang}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    />
  )
}
