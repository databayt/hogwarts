// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionValuesProps {
  lang: Locale
  dictionary?: Dictionary
}

// Zenda section grammar: centered eyebrow + headline, then flat white
// rounded tiles on the cream. Colors are pinned -- the cream never flips.
export function AdmissionValues({ lang, dictionary }: AdmissionValuesProps) {
  const dict =
    (
      dictionary as unknown as {
        school?: {
          admission?: { sections?: { values?: Record<string, string> } }
        }
      }
    )?.school?.admission?.sections?.values ?? {}

  const values = [
    { number: "01", title: dict.academicExcellence || "Academic Excellence" },
    { number: "02", title: dict.globalPerspective || "Global Perspective" },
    {
      number: "03",
      title: dict.nurturingEnvironment || "Nurturing Environment",
    },
    {
      number: "04",
      title: dict.characterDevelopment || "Character Development",
    },
  ]

  return (
    <SectionContainer>
      <div className="mb-16 text-center">
        <p className="eyebrow band-muted mb-3">{dict.eyebrow || "Why us"}</p>
        <h2 className="font-heading text-3xl font-bold text-neutral-900 md:text-4xl">
          {dict.title || "Why Choose Us"}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {values.map((value) => (
          <div
            key={value.number}
            className="flex min-h-40 flex-col justify-between rounded-3xl bg-white p-6 md:p-8"
          >
            <span className="text-sm font-medium text-neutral-400">
              {value.number}
            </span>
            <h3 className="font-heading text-lg font-semibold text-neutral-900 md:text-xl">
              {value.title}
            </h3>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
