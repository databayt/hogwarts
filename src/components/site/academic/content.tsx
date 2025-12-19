"use client"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import Footer from "../footer"
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

export default function AcademicContent({ school, dictionary, lang }: Props) {
  return (
    <div>
      <AcademicHero lang={lang} dictionary={dictionary} />
      <AcademicPrograms lang={lang} dictionary={dictionary} />
      <AcademicStats lang={lang} dictionary={dictionary} />
      <AcademicCurriculum lang={lang} dictionary={dictionary} />
      <AcademicCTA lang={lang} dictionary={dictionary} />
      <Footer />
    </div>
  )
}
