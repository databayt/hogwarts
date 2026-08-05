// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionStatsProps {
  lang: Locale
  dictionary?: Dictionary
}

/*
 * Zenda's stat-trio pattern (big figure, small label, three across). The
 * figures are the application promises the hero already makes -- free, about
 * twenty minutes, an answer within two weeks -- not invented school metrics,
 * which this template must never fabricate.
 */
export function AdmissionStats({ lang, dictionary }: AdmissionStatsProps) {
  const dict =
    (
      dictionary as unknown as {
        school?: {
          admission?: { sections?: { stats?: Record<string, string> } }
        }
      }
    )?.school?.admission?.sections?.stats ?? {}

  const stats = [
    {
      value: dict.free || "Free",
      label: dict.freeLabel || "to apply — no application fee",
    },
    {
      value: dict.minutes || "20 min",
      label: dict.minutesLabel || "to complete the application",
    },
    {
      value: dict.weeks || "2 weeks",
      label: dict.weeksLabel || "at most to receive a decision",
    },
  ]

  return (
    <SectionContainer className="py-10 md:py-14 lg:py-16">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-heading text-4xl font-bold text-neutral-900 md:text-5xl">
              {stat.value}
            </div>
            <div className="band-muted mt-2 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
