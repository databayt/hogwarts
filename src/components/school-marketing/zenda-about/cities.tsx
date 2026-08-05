// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/cities). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

import { Fragment } from "react"

import { AboutCitiesScroll } from "./cities-scroll"

/**
 * About "Our Growth Journey" — a centred header (location-pin icon, heading,
 * subtitle) over a stack of pill-shaped timeline rows. Each row pairs a city
 * count + city names on the left with a big year pill on the right; the rows
 * reveal on scroll (see <AboutCitiesScroll/>). Ported from zenda.com/about-us.
 */

type City = {
  count: [string, string] // e.g. ["3", "cities"] / ["To be", "Live"]
  details: string[] // city-name lines (joined by <br>)
  year: string
  isLast?: boolean
}

const CITIES: City[] = [
  {
    count: ["3", "cities"],
    details: ["Dubai, Kochi,", "Bengaluru"],
    year: "2021",
  },
  { count: ["+2", "cities"], details: ["Abu Dhabi, Sharjah"], year: "2022" },
  { count: ["+2", "cities"], details: ["Doha, Bahrain"], year: "2023" },
  {
    count: ["+3", "cities"],
    details: ["Singapore,", "Kuwait, Riyadh"],
    year: "2024",
  },
  {
    count: ["To be", "Live"],
    details: ["Ho chi Minh, Bangkok", "London, Barcelona, Geneva"],
    year: "2025",
    isLast: true,
  },
]

// Join an array of strings into JSX separated by <br/>.
function withBreaks(lines: string[]) {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))
}

export function Cities() {
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
                  Our Growth Journey
                </h2>
                <p className="text-size-xlarge">From Funding to Footprints</p>
              </div>
            </div>

            <div className="padding-bottom padding-large" />

            <div about-cities-wrap="" className="about-cities_list">
              {CITIES.map(({ count, details, year, isLast }) => (
                <div
                  key={year}
                  about-cities-item=""
                  className="about-cities_item"
                >
                  <div about-cities-content="" className="about-cities_content">
                    <div className="about-cities_partner-wrap">
                      <div className="text-size-xlarge">
                        {count[0]}
                        <br />
                        {count[1]}
                      </div>
                    </div>
                    <div
                      className={`about-cities_details ${isLast ? "is-last" : ""}`.trim()}
                    >
                      <div className="text-size-xlarge">
                        {withBreaks(details)}
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
              ))}
            </div>
          </div>
        </div>
      </div>
      <AboutCitiesScroll />
    </section>
  )
}
