import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../types"
import { AdmissionCTA } from "./sections/cta"
import { AdmissionDates } from "./sections/dates"
import { AdmissionHero } from "./sections/hero"
import { AdmissionProcess } from "./sections/process"
import { AdmissionRequirements } from "./sections/requirements"
import { AdmissionValues } from "./sections/values"

interface Props {
  school: School
  dictionary: Dictionary
  lang: Locale
  subdomain: string
}

export default function AdmissionContent({ school, dictionary, lang }: Props) {
  return (
    <main className="bg-background flex flex-col">
      <AdmissionHero lang={lang} dictionary={dictionary} />
      <AdmissionValues lang={lang} dictionary={dictionary} />
      <AdmissionProcess lang={lang} dictionary={dictionary} />
      <AdmissionRequirements lang={lang} dictionary={dictionary} />
      <AdmissionDates lang={lang} dictionary={dictionary} />
      <AdmissionCTA lang={lang} dictionary={dictionary} />
    </main>
  )
}
