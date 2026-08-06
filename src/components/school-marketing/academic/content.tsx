// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../types"
import { AcademicCTA } from "./sections/cta"
import { AcademicCurriculum } from "./sections/curriculum"
import { AcademicHero } from "./sections/hero"
import { AcademicIntro } from "./sections/intro"
import { AcademicMarquee } from "./sections/marquee"
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
 *
 * The first three sections are zenda's /for-schools opening in its own order,
 * and that order is load-bearing: hero -> marquee -> card. The building leaves
 * the hero, crosses the marquee's faint words, and lands in the card's slot.
 * Put anything between them and the flight passes behind it.
 */
export default function AcademicContent({ school, dictionary, lang }: Props) {
  return (
    <main className="band-cream flex flex-col">
      <AcademicHero lang={lang} dictionary={dictionary} />
      <AcademicMarquee
        words={dictionary?.marketing?.site?.academic?.marquee?.words}
      />
      <AcademicIntro lang={lang} dictionary={dictionary} />
      <AcademicPrograms lang={lang} dictionary={dictionary} />
      <AcademicStats lang={lang} dictionary={dictionary} />
      <AcademicCurriculum lang={lang} dictionary={dictionary} />
      <AcademicCTA lang={lang} dictionary={dictionary} />
    </main>
  )
}
