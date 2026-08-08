// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (home/hero). Renders under the `.zenda-clone` CSS scope
// (see src/styles/zenda-clone.css).
//
// One deviation from the source: zenda's "EXPLORE" pill is relabelled "APPLICATION"
// and points at the application wizard -- the one action a parent landing on a
// school's homepage is actually here to take. It stays the default dark
// `button-v2`, so the diagonal hover sweep, the label roll and the elastic
// press all still work.

import Link from "next/link"

import type { Dictionary } from "@/components/internationalization/dictionaries"

// The intro animation is driven by GSAP in <HeroIntro/> (rendered on the home
// page). The elements below are tagged with `hero-element` / `hero-btn` /
// `hero-video` so that timeline can target them; the logo + nav links it also
// animates live in the Header (`hero-logo` / `hero-link`).
export function Hero({
  lang = "en",
  dictionary,
}: {
  lang?: string
  dictionary?: Dictionary
}) {
  const applyLabel =
    dictionary?.marketing?.site?.home?.hero?.applyLabel ?? "Application"

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
                {dictionary?.marketing?.site?.home?.hero?.heading ??
                  "Clear, close, always here."}
              </h1>
              <div className="padding-bottom padding-xsmall"></div>
              <div className="max-width is-27rem">
                <p id="hero-para" hero-element="" className="home-hero_para">
                  {dictionary?.marketing?.site?.home?.hero?.lede ??
                    "A place worth joining."}
                </p>
              </div>
              <div className="padding-bottom padding-medium"></div>
              <div hero-btn="" className="button-group">
                <div className="button_component">
                  <Link
                    href={`/${lang}/application`}
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
                    {/* `data-text` is the label's rolled duplicate -- it must
                        match the visible text exactly or the hover roll shows
                        two different words. */}
                    <span data-text={applyLabel} className="button-v2_inner">
                      <span className="button-v2_text">{applyLabel}</span>
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
