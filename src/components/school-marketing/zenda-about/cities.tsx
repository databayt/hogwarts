// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/cities) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css). The CSS class names still say "cities"; the rows
// now carry the school's year-by-year growth in grades instead.

import { Fragment } from "react"

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AboutCitiesScroll } from "./cities-scroll"

/**
 * About "Our Growth Journey" — a centred header (map-pin icon, heading,
 * subtitle) over a stack of pill-shaped timeline rows. Each row pairs a grade
 * count + the grades it opened on the left with a big year pill on the right;
 * the rows reveal on scroll (see <AboutCitiesScroll/>).
 *
 * PLACEHOLDER FIGURES. These milestones are illustrative, like the demo
 * homepage's class-size and placement numbers — every tenant must replace them
 * with its own history before publishing. Keep the row count at five: the
 * reveal timeline staggers per row and the layout is tuned for this length.
 *
 * Copy now lives in the dictionary at `marketing.site.about.cities` (en + ar).
 * `EN_FALLBACK_MILESTONES` below is the previously-hardcoded English, kept
 * in-file as the fallback for a missing/short translation.
 */

type MilestoneCopy = {
  countValue: string // e.g. "3" / "To be"
  countLabel: string // e.g. "grades" / "Live"
  details: string // grade lines, joined by "\n" (split + <br> at render)
  year: string
}

type Milestone = MilestoneCopy & { isLast?: boolean }

// English fallback copy, verbatim from the previous hardcoded MILESTONES
// array. Used when the dictionary is unavailable, or a translated milestone
// entry is missing — index by index, never assume the whole set is present.
const EN_FALLBACK_MILESTONES: MilestoneCopy[] = [
  {
    countValue: "3",
    countLabel: "grades",
    details: "Kindergarten,\nPrimary 1 and 2",
    year: "2021",
  },
  {
    countValue: "+2",
    countLabel: "grades",
    details: "Primary 3 and 4",
    year: "2022",
  },
  {
    countValue: "+2",
    countLabel: "grades",
    details: "Primary 5 and 6",
    year: "2023",
  },
  {
    countValue: "+3",
    countLabel: "grades",
    details: "Middle school opens,\nGrades 7, 8 and 9",
    year: "2024",
  },
  {
    countValue: "To be",
    countLabel: "Live",
    details: "Secondary 1, 2 and 3,\nscience and arts streams",
    year: "2025",
  },
]

// Copy comes from `marketing.site.about.cities.milestones`, a plain array. The
// English fallback governs the row COUNT so a truncated translation cannot
// silently shorten the timeline — `isLast` drives the closing row's styling,
// and it has to land on a row that exists.
function getMilestones(dictionary?: Dictionary): Milestone[] {
  const milestones = dictionary?.marketing?.site?.about?.cities?.milestones
  return EN_FALLBACK_MILESTONES.map((fallback, i) => ({
    ...(milestones?.[i] ?? fallback),
    isLast: i === EN_FALLBACK_MILESTONES.length - 1,
  }))
}

// Join an array of strings into JSX separated by <br/>.
function withBreaks(lines: string[]) {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))
}

export function Cities({ dictionary }: { dictionary?: Dictionary }) {
  const citiesDict = dictionary?.marketing?.site?.about?.cities
  const heading = citiesDict?.heading ?? "Our Growth Journey"
  const subtitle =
    citiesDict?.subtitle ?? "From our first classroom to a full campus"
  const milestones = getMilestones(dictionary)

  return (
    <section className="section_about-cities">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-medium">
          <div className="about-cities_wrap">
            <div className="about-cities_header">
              <div className="about-cities_icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  viewBox="0 0 70 94"
                  fill="none"
                  className="svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7.63639 52.7519L36.5285 94.353L63.6115 51.5522C77.764 29.1863 61.6936 0 35.2261 0C8.10702 0 -7.83312 30.4777 7.63639 52.7519Z"
                    fill="#C8ACF4"
                  />
                  <circle
                    cx="34.3054"
                    cy="31.781"
                    r="15.3953"
                    fill="#F4F2EC"
                    stroke="#C8ACF4"
                    strokeWidth="3.13685"
                  />
                </svg>
              </div>
              <div>
                <h2 className="about-cities_heading heading-style-h2">
                  {heading}
                </h2>
                <p className="text-size-xlarge">{subtitle}</p>
              </div>
            </div>

            <div className="padding-bottom padding-large" />

            <div about-cities-wrap="" className="about-cities_list">
              {milestones.map(
                ({ countValue, countLabel, details, year, isLast }) => (
                  <div
                    key={year}
                    about-cities-item=""
                    className="about-cities_item"
                  >
                    <div
                      about-cities-content=""
                      className="about-cities_content"
                    >
                      <div className="about-cities_partner-wrap">
                        <div className="text-size-xlarge">
                          {countValue}
                          <br />
                          {countLabel}
                        </div>
                      </div>
                      <div
                        className={`about-cities_details ${isLast ? "is-last" : ""}`.trim()}
                      >
                        <div className="text-size-xlarge">
                          {withBreaks(details.split("\n"))}
                        </div>
                      </div>
                    </div>
                    <div
                      about-cities-block=""
                      className="about-cities_year-block"
                    >
                      <div className="about-cities_year">{year}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      <AboutCitiesScroll />
    </section>
  )
}
