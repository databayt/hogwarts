// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"
import { DatesReveal } from "./dates-reveal"

interface AdmissionDatesProps {
  lang: Locale
  dictionary?: Dictionary
}

/*
 * Key Dates, on zenda's `about-cities` "Our Growth Journey" pattern: contiguous
 * capsule rows, each pairing the milestone on the start side with a big date
 * pill pinned to the end. It replaced a thin vertical rule of 16px date badges
 * -- the same four dates, but the one thing a parent actually scans this page
 * for was the smallest thing on it.
 *
 * The content is unchanged: the same `school.admission.sections.dates` keys,
 * the same four milestones. Only the rendering moved.
 *
 * Not the `.zenda-clone` port at `zenda-about/cities.tsx` -- that scope is
 * English/LTR-only and this page is bilingual, so the geometry lives in
 * `.zenda-tl-*` (school-marketing.css) on logical properties instead. That port
 * also hardcodes five rows because its GSAP stagger is tuned to that length;
 * ours is a CSS `--i` per row, so any number works.
 */
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

      {/* zenda's `container-medium`. Rows are gapless by design -- adjacent
       * capsules share an edge, which is what makes the stack read as one
       * ladder rather than four loose pills. */}
      <div
        id="admission-dates-list"
        className="zenda-tl-list relative mx-auto max-w-4xl"
      >
        {dates.map((item, index) => (
          <div
            key={index}
            className="zenda-tl-item"
            style={{ "--i": index } as React.CSSProperties}
          >
            <div className="zenda-tl-content">
              <h3 className="zenda-tl-lead">{item.title}</h3>
              <p className="zenda-tl-detail">{item.description}</p>
            </div>
            <div className="zenda-tl-pill">
              <span className="zenda-tl-date">{item.date}</span>
            </div>
          </div>
        ))}
      </div>

      <DatesReveal targetId="admission-dates-list" />
    </SectionContainer>
  )
}
