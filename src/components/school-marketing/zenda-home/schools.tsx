// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/schools). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

/* eslint-disable @next/next/no-img-element */
import Link from "next/link"

import { InstitutesLottie } from "./schools-lottie"
import { SchoolsScroll } from "./schools-scroll"

const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"
const LOCATION_ICON = CDN + "67e397d50fcc10ce71f963a4_IcBaselineLocationOn.svg"

// ⚠️ BLOCKER, carried deliberately: these are twelve REAL institutions (Arbor,
// Amity Abu Dhabi, Nord Anglia, Repton, North Collegiate, Raffles + six
// unnamed) that the reference shows as its customers. On a tenant's homepage
// they claim relationships the school does not have -- the same standing
// blocker as the about page's investor and accrediting-council logos. Swap for
// the school's own imagery or delete the grid before any real school
// publishes. Copy cannot fix this one.
const LOGOS = [
  CDN + "68f1ec48cc96ed312abad7d2_Arbor.png",
  CDN + "68f1ec48c8fa1b940449088a_Amity%20Abu%20Dhabi.png",
  CDN + "68f1ec48d16a6cda10f99ce9_Nord%20Anglia.png",
  CDN + "68f1ec485ba2216629bdd4f2_Repton.png",
  CDN + "68f1ec482456eae5b05ec3b0_North%20Collegiate.png",
  CDN + "67f6139c26e5b2c9743ddc08_school-logo07.webp",
  CDN + "67f6139c7eb8b47b585febf1_school-logo08.webp",
  CDN + "67f6139c6629053730c83d34_school-logo09.webp",
  CDN + "67f6139c653aa4aead67d967_school-logo10.webp",
  CDN + "67f6139b6629053730c83d20_school-logo11.webp",
  CDN + "68f1ec486b1b742bee7409d0_Raffles.png",
  CDN + "67f6139b8894ac8994256618_school-logo06.webp",
]

export function Schools({ lang = "en" }: { lang?: string }) {
  return (
    <section id="schools" className="section_schools">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="schools_wrap">
            <div school-wrap="" className="schools_header-wrap">
              <div className="schools_header">
                <div school-icon="" className="schools_icon-wrap">
                  <img
                    src={LOCATION_ICON}
                    loading="lazy"
                    alt=""
                    className="img-auto"
                  />
                </div>
                <div school-element="" className="tag is-text">
                  SCHOOLS
                </div>
                <h2
                  school-element=""
                  className="schools_heading heading-style-h2"
                >
                  Everything in one place
                </h2>
                {/* The school's copy at the reference's word counts (4 and 6).
                    Claim-free by design: "Trusted by 450+ institutions" is a
                    vendor's number, and a single school has no countable claim
                    to put in its place -- so this asserts nothing a tenant
                    would have to back. */}
                <p school-element="" className="schools_para">
                  for families, teachers and everyone between
                </p>
              </div>

              <div className="schools_lottie-wrap">
                <InstitutesLottie />
              </div>
            </div>

            <div className="schools_content_wrap">
              <h3 className="schools_content_heading heading-style-h3">
                Enrolled. Informed. Involved.
              </h3>
              {/* 26 words, as the reference's fintech paragraph was. It names
                  only what ships -- the application wizard, the student record
                  and the parent portal -- so nothing here needs a figure or a
                  partner to stand up. */}
              <p className="text-size-medium">
                From the first application to the last report card, the school
                keeps one record of every child, and gives families a window
                onto it, any hour.
              </p>
            </div>

            <div className="schools_logo-component">
              <div className="schools_grid">
                {LOGOS.map((src) => (
                  <div key={src} className="schools_item">
                    <div className="schools_logo-wrap">
                      <img
                        src={src}
                        loading="lazy"
                        width={140}
                        height={140}
                        alt=""
                        className="img-auto"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="button_component">
                {/* The reference sends this to its own /for-schools page,
                    which 404s here. /about is the school's equivalent: its
                    story, told at length. */}
                <Link
                  href={`/${lang}/about`}
                  className="button-v2 w-inline-block"
                >
                  <span className="button-v2_bg">
                    <span
                      style={{ "--index": 0 } as React.CSSProperties}
                      className="button-v2_bg-inner is-first"
                    ></span>
                    <span
                      style={{ "--index": 1 } as React.CSSProperties}
                      className="button-v2_bg-inner is-second"
                    ></span>
                  </span>
                  <span data-text="Explore" className="button-v2_inner">
                    <span className="button-v2_text">Explore</span>
                  </span>
                </Link>
              </div>
            </div>

            <SchoolsScroll />
          </div>
        </div>
      </div>
    </section>
  )
}
