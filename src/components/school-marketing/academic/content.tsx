// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../types"
import { AcademicCTA } from "./sections/cta"
import { AcademicCurriculum } from "./sections/curriculum"
import { AcademicHero } from "./sections/hero"
import { AcademicPrograms } from "./sections/programs"
import { AcademicStats } from "./sections/stats"

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
export default function AcademicContent({ school, dictionary, lang }: Props) {
  return (
    <main className="band-cream flex flex-col">
      <AcademicHero lang={lang} dictionary={dictionary} />
      <AcademicPrograms lang={lang} dictionary={dictionary} />
      <AcademicStats lang={lang} dictionary={dictionary} />
      <AcademicCurriculum lang={lang} dictionary={dictionary} />
      <AcademicCTA lang={lang} dictionary={dictionary} />
    </main>
  )
}
