// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../types"
import { AdmissionCTA } from "./sections/cta"
import { AdmissionDates } from "./sections/dates"
import { AdmissionHero } from "./sections/hero"
import { AdmissionProcess } from "./sections/process"
import { AdmissionRequirements } from "./sections/requirements"
import { AdmissionStats } from "./sections/stats"
import { AdmissionValues } from "./sections/values"

interface Props {
  school: School
  dictionary: Dictionary
  lang: Locale
}

/*
 * Sits between the zenda nav and footer, both of which paint zenda's cream
 * and never flip dark -- so the page surface is `.band-cream` (fixed light
 * scheme) and every section pins its own colors instead of using theme
 * tokens that would invert against the unchanging chrome. The old page
 * footer is gone: the layout already renders the zenda footer below <main>.
 */
export default function AdmissionContent({ school, dictionary, lang }: Props) {
  return (
    <main className="band-cream flex flex-col">
      <AdmissionHero lang={lang} dictionary={dictionary} />
      <AdmissionStats lang={lang} dictionary={dictionary} />
      <AdmissionValues lang={lang} dictionary={dictionary} />
      <AdmissionProcess lang={lang} dictionary={dictionary} />
      <AdmissionRequirements lang={lang} dictionary={dictionary} />
      <AdmissionDates lang={lang} dictionary={dictionary} />
      <AdmissionCTA lang={lang} dictionary={dictionary} />
    </main>
  )
}
