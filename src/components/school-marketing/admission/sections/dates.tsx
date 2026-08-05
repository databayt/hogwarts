// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionDatesProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionDates({ lang, dictionary }: AdmissionDatesProps) {
  const dict =
    (
      dictionary as unknown as {
        school?: {
          admission?: { sections?: { dates?: Record<string, string> } }
        }
      }
    )?.school?.admission?.sections?.dates ?? {}

  const dates = [
    {
      date: dict.sept1 || "Sept 1",
      title: dict.applicationsOpen || "Applications Open",
      description: dict.applicationsOpenDesc || "Begin your online application",
    },
    {
      date: dict.nov15 || "Nov 15",
      title: dict.earlyDeadline || "Early Deadline",
      description:
        dict.earlyDeadlineDesc || "Last date for early decision applications",
    },
    {
      date: dict.jan15 || "Jan 15",
      title: dict.regularDeadline || "Regular Deadline",
      description:
        dict.regularDeadlineDesc || "Final deadline for regular admission",
    },
    {
      date: dict.mar1 || "Mar 1",
      title: dict.decisionsReleased || "Decisions Released",
      description:
        dict.decisionsReleasedDesc ||
        "Admission notifications sent to applicants",
    },
  ]

  return (
    <SectionContainer>
      <div className="mb-16 text-center">
        <p className="eyebrow band-muted mb-3">{dict.eyebrow || "Timeline"}</p>
        <h2 className="font-heading text-3xl font-bold text-neutral-900 md:text-4xl">
          {dict.title || "Key Dates"}
        </h2>
      </div>

      <div className="relative mx-auto max-w-2xl">
        {/* Timeline line - visible on md+ */}
        <div className="absolute start-8 top-0 bottom-0 hidden w-px bg-neutral-900/10 md:block" />

        <div className="space-y-8 md:space-y-12">
          {dates.map((item, index) => (
            <div key={index} className="flex items-start gap-6 md:gap-8">
              {/* Date badge */}
              <div className="band-charcoal z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
                <span className="px-1 text-center text-xs leading-tight font-semibold">
                  {item.date}
                </span>
              </div>

              {/* Content */}
              <div className="pt-3">
                <h3 className="font-heading mb-1 text-lg font-semibold text-neutral-900">
                  {item.title}
                </h3>
                <p className="text-neutral-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
