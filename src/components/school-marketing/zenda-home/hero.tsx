// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (home/hero). Renders under the `.zenda-clone` CSS scope
// (see src/styles/zenda-clone.css).
//
// One deviation from the source: zenda's single "EXPLORE" pill becomes the two
// actions a parent visiting a school actually has -- book a tour, or read about
// admissions. Both are real zenda `button-v2` variants (the default dark pill
// and the `is-alternate` white one), so the diagonal hover sweep, the label
// roll and the elastic press all still work.

import Link from "next/link"

// The intro animation is driven by GSAP in <HeroIntro/> (rendered on the home
// page). The elements below are tagged with `hero-element` / `hero-btn` /
// `hero-video` so that timeline can target them; the logo + nav links it also
// animates live in the Header (`hero-logo` / `hero-link`).
export function Hero({ lang = "en" }: { lang?: string }) {
  return (
    <header className="section_home-hero">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <header className="home-hero_wrap">
            <div className="home-hero_content">
              <h1
                id="hero-header"
                hero-element=""
                className="home-hero_heading heading-style-h1"
              >
                Smart, simple, magical
              </h1>
              <div className="padding-bottom padding-xsmall"></div>
              <div className="max-width is-27rem">
                <p id="hero-para" hero-element="" className="home-hero_para">
                  The app parents love.
                </p>
              </div>
              <div className="padding-bottom padding-medium"></div>
              <div hero-btn="" className="button-group">
                <div className="button_component">
                  <Link
                    href={`/${lang}/tour`}
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
                    <span
                      data-text="Schedule a Visit"
                      className="button-v2_inner"
                    >
                      <span className="button-v2_text">Schedule a Visit</span>
                    </span>
                  </Link>
                </div>
                <div className="button_component">
                  <Link
                    href={`/${lang}/admissions`}
                    className="button-v2 w-inline-block is-alternate"
                  >
                    <span className="button-v2_bg is-alternate">
                      <span
                        style={{ "--index": 0 } as React.CSSProperties}
                        className="button-v2_bg-inner is-first is-alternate"
                      ></span>
                      <span
                        style={{ "--index": 1 } as React.CSSProperties}
                        className="button-v2_bg-inner is-second is-alternate"
                      ></span>
                    </span>
                    <span data-text="Learn More" className="button-v2_inner">
                      <span className="button-v2_text">Learn More</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="home-hero_video-component">
              <div hero-video="" className="home-hero_video-wrap">
                <div className="home-hero_video w-background-video">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster="/images/hero/hero-poster.webp"
                    style={{
                      backgroundImage: 'url("/images/hero/hero-poster.webp")',
                    }}
                    data-object-fit="cover"
                  >
                    <source src="/videos/hero-3d.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>
    </header>
  )
}
