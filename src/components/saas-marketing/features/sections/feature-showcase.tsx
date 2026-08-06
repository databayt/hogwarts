// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Per-feature "Services" deck — a faithful clone of zenda.com/for-schools
// `section_services` (GSAP scale + scroll-spy dots), parameterized with feature
// capability cards. Instead of zenda's pre-rendered marketing webp slides, each
// card composes the same artwork live: pastel panel (zenda's exact slide
// palette), a white browser window with traffic dots, the real product
// screenshot zoomed to its interesting region, floating UI-echo chips and an
// optional stat band. The one deliberate divergence from the reference: the
// band behind the deck is the app's muted token, not zenda cream.

"use client"

import { createElement, useEffect, useRef } from "react"
import { DM_Sans } from "next/font/google"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { getIconComponent } from "../icon-map"
import type { ShowcaseData } from "../types"

// zenda sets the whole deck in DM Sans (`--font-heading` → `--font-dm-sans`).
// Only the tenant school-marketing layout registers that face; this deck also
// renders on the SaaS /features/[id] tree, where the unresolved var made every
// element silently inherit Satoshi. Declared here (not imported from
// template/zenda-fonts) so Poppins doesn't ship with it; weights mirror
// zenda's app/[lang]/layout.tsx exactly.
const fontDmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
})

/** Pill color variants from the zenda scope, cycled by card index. */
const TAG_VARIANTS = ["", " is-autopay", " is-marketplace", " is-re-enrollment"]

/**
 * Panel pastels, cycled by card index — sampled straight out of zenda's own
 * for-schools slide webps, in their order (purple, pink, purple, pink, beige).
 * Their deck really does repeat purple on slide 3; that isn't a mistake here.
 * The near-identical `p-services_img-bg` CSS vars land within 1/255 of these,
 * except `is-payment-plan` blue, which belongs to their parents page and never
 * appears in this deck.
 */
const PANEL_COLORS = ["#e4d4fe", "#fcd0e6", "#e4d3ff", "#fecfe6", "#dad5cb"]

// In dark mode the band goes dark while the cards stay white (zenda's own
// look), so band-level text and the scroll-spy rail need flipping.
//
// These are literal oklch values, not `var(--foreground)`, because
// `zenda-clone.css` re-declares the app's whole token set on `.zenda-clone`
// and scopes the dark half to `.zenda-clone .dark` — a descendant selector
// that never matches, since `.dark` lives on <html> ABOVE the band. Any app
// token read inside this subtree is therefore pinned to the light value.
// Values below are copied from that file's dark block.
const DARK_BAND_CSS = `
.dark .zenda-clone.showcase-band .section_services .services_heading { color: oklch(0.985 0 0); }
.dark .zenda-clone.showcase-band .section_services .tag.is-text { color: oklch(0.708 0 0); }
.dark .zenda-clone.showcase-band .section_services .services_link { background-color: oklch(1 0 0 / 25%); }
.dark .zenda-clone.showcase-band .section_services .services_link.w--current { background-color: oklch(0.985 0 0); }
`

// zenda's deck is sized for a full marketing page; on a feature detail page it
// dwarfs the surrounding content. These trim the whole composition ~15% —
// narrower rail, smaller type, tighter card padding. The panel artwork is
// container-relative, so shrinking the rail shrinks it in proportion.
const SCALE_CSS = `
.zenda-clone.showcase-band .container-large { max-width: 68rem; }
.zenda-clone.showcase-band .section_services .services_heading { font-size: 3rem; }
.zenda-clone.showcase-band .services_sub-heading.heading-style-h2 { font-size: 2.5rem; }
.zenda-clone.showcase-band .services_para { font-size: 1.125rem; }
.zenda-clone.showcase-band .services_tag { font-size: 1rem; padding: 0.4rem 1rem; }
.zenda-clone.showcase-band .services_sticky-card { padding: 2.25rem; border-radius: 2.25rem; }
.zenda-clone.showcase-band .services_grid { grid-column-gap: 2rem; grid-row-gap: 2rem; }
.zenda-clone.showcase-band .services_list { grid-column-gap: 3rem; grid-row-gap: 3rem; }
@media screen and (max-width: 991px) {
  .zenda-clone.showcase-band .section_services .services_heading { font-size: 2.375rem; }
  .zenda-clone.showcase-band .services_sub-heading.heading-style-h2 { font-size: 2rem; }
}
@media screen and (max-width: 767px) {
  .zenda-clone.showcase-band .section_services .services_heading { font-size: 1.875rem; }
  .zenda-clone.showcase-band .services_sticky-card { padding: 1.5rem; }
}
`

interface Props {
  data: ShowcaseData
}

export function FeatureShowcase({ data }: Props) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.innerWidth <= 767) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[services-card]")
      const dots = gsap.utils.toArray<HTMLElement>("[services-dot]")

      const remPx =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const pin = `top ${6 * remPx}px`
      const spy = `top ${7 * remPx}px`

      const setCurrent = (i: number) => {
        const idx = Math.max(0, Math.min(i, dots.length - 1))
        dots.forEach((d, di) => d.classList.toggle("w--current", di === idx))
      }
      setCurrent(0)

      cards.forEach((card, i) => {
        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.92,
            transformOrigin: "50% 0%",
            ease: "none",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top bottom",
              end: pin,
              scrub: true,
            },
          })
        }

        ScrollTrigger.create({
          trigger: card,
          start: spy,
          onEnter: () => setCurrent(i),
          onLeaveBack: () => setCurrent(i - 1),
        })
      })
    }, section)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener("load", refresh)
    const refreshTimer = window.setTimeout(refresh, 600)

    return () => {
      window.removeEventListener("load", refresh)
      window.clearTimeout(refreshTimer)
      ctx.revert()
    }
  }, [])

  const headingLines = data.heading.split("\n")

  return (
    // The background sits on this wrapper, OUTSIDE `.zenda-clone`, so
    // `bg-muted`/`border-border` read the app's real tokens and follow the
    // theme (DARK_BAND_CSS above explains why they can't inside). Symmetric
    // negative margins full-bleed out of the centered container in either
    // direction — `left-50%` + `translateX(-50%)` is physical and put the band
    // 256px off on /ar, taking the whole page into horizontal overflow.
    <div className="border-border/40 bg-muted relative mx-[calc(50%-50vw)] my-12 overflow-x-clip border-y py-12 md:py-16">
      <div
        className={`zenda-clone showcase-band ${fontDmSans.variable}`}
        style={
          {
            "--font-heading": "var(--font-dm-sans)",
            fontFamily: "var(--font-dm-sans), sans-serif",
            // `.zenda-clone` carries a Webflow body reset (`background-color:
            // #fff`) that would paint over the wrapper's bg-muted. It has to be
            // cleared inline: zenda-clone.css is unlayered, so it outranks
            // Tailwind's layered utilities and `bg-transparent` would lose.
            backgroundColor: "transparent",
          } as React.CSSProperties
        }
      >
        <style>{DARK_BAND_CSS + SCALE_CSS}</style>
        <section ref={sectionRef} className="section_services">
          <div className="padding-global-v2 padding-section-large">
            <div className="container-large">
              <div className="services_wrap">
                <div className="services_header">
                  <div className="tag is-text">{data.eyebrow}</div>
                  <div className="padding-bottom padding-small"></div>
                  <div className="max-width-large align-center">
                    <h2 className="services_heading heading-style-h2">
                      {headingLines.map((line, i) => (
                        <span key={line}>
                          {i > 0 && <br />}
                          {line}
                        </span>
                      ))}
                    </h2>
                  </div>
                </div>

                <div className="padding-bottom padding-xxlarge"></div>

                <div className="services_list">
                  {data.cards.map((card, i) => {
                    const panel =
                      card.visual?.panel ??
                      PANEL_COLORS[i % PANEL_COLORS.length]
                    const zoom = card.visual?.zoom ?? 1
                    const origin = card.visual?.origin ?? "50% 0%"
                    const chips = card.visual?.chips?.slice(0, 2) ?? []
                    const stat = card.visual?.stat

                    return (
                      <div
                        key={card.tag}
                        id={`showcase-card-${i + 1}`}
                        services-card=""
                        className="services_sticky-card"
                      >
                        <div className="services_grid">
                          <div className="services_content-wrap">
                            <div
                              className={`services_tag${TAG_VARIANTS[i % TAG_VARIANTS.length]}`}
                            >
                              <div className="icon-embed-xsmall w-embed">
                                {createElement(getIconComponent(card.icon), {
                                  className: "size-full",
                                  strokeWidth: 2,
                                  "aria-hidden": true,
                                })}
                              </div>
                              <div>{card.tag}</div>
                            </div>
                            <div className="services_content">
                              <div className="max-width-xxsmall">
                                <h2
                                  dir="auto"
                                  className="services_sub-heading heading-style-h2"
                                >
                                  {card.title}
                                </h2>
                              </div>
                              <div className="padding-bottom padding-xsmall"></div>
                              <div className="max-width is-24rem">
                                <p dir="auto" className="services_para">
                                  {card.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="services_img-wrap">
                            {/* Composed slide, mirroring zenda's marketing webp
                              geometry (2561×2095 panel, inset browser window).
                              Self-painted artwork: identical in dark mode.

                              Every size inside is in `cqw` (% of this panel's
                              width) so the composition scales as one piece, the
                              way the reference's flat webp slides do — at fixed
                              rem sizes the chips stayed desktop-sized and
                              swamped the panel on mobile. */}
                            <div
                              dir="ltr"
                              className="@container relative aspect-[2561/2095] w-full"
                              style={{ backgroundColor: panel }}
                            >
                              <div className="absolute inset-x-[11%] inset-y-[8%] flex flex-col overflow-hidden rounded-[3.9cqw] bg-white shadow-[0_24px_48px_-28px_rgba(30,30,30,0.35)]">
                                <div className="flex shrink-0 items-center gap-[1.2cqw] px-[3.5cqw] pt-[2.8cqw] pb-[2.1cqw]">
                                  {[0, 1, 2].map((d) => (
                                    <span
                                      key={d}
                                      className="size-[1.9cqw] rounded-full"
                                      style={{
                                        backgroundColor: `color-mix(in srgb, ${panel} 75%, white)`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <div className="relative min-h-0 flex-1 overflow-hidden">
                                  <Image
                                    src={card.image}
                                    alt={card.title}
                                    fill
                                    // The frame is ~446px wide, but `zoom` blows
                                    // the shot up past that — ask for the native
                                    // 1280 capture or the crop renders upscaled.
                                    sizes="(max-width: 767px) 200vw, 1280px"
                                    className="object-cover"
                                    style={{
                                      objectPosition: "0% 0%",
                                      transform: `scale(${zoom})`,
                                      transformOrigin: origin,
                                    }}
                                  />
                                  {/* A crop lands mid-row; fade the cut so it
                                    reads as more content, not a clipping bug. */}
                                  <div className="absolute inset-x-0 bottom-0 h-[6cqw] bg-gradient-to-t from-white to-transparent" />
                                </div>
                                {stat && (
                                  <div className="shrink-0 px-[2.8cqw] pt-[2.1cqw] pb-[2.8cqw]">
                                    <div
                                      className="rounded-[2.1cqw] px-[2.8cqw] py-[1.75cqw] text-center text-[2.66cqw] leading-snug font-medium text-[#1e1e1e]"
                                      style={{
                                        backgroundColor: `color-mix(in srgb, ${panel} 30%, white)`,
                                      }}
                                    >
                                      {stat}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {chips.map((chip, ci) => (
                                <div
                                  key={chip.label}
                                  // Second chip rides above the stat band's row so
                                  // the two never overlap on a card that has both.
                                  className={`absolute flex items-center gap-[1.75cqw] rounded-[2.8cqw] border border-black/8 bg-white py-[1.75cqw] ps-[1.75cqw] pe-[2.8cqw] shadow-[0_14px_28px_-16px_rgba(30,30,30,0.35)] ${
                                    ci === 0
                                      ? "top-[13%] right-[3.5%]"
                                      : "bottom-[26%] left-[3.5%]"
                                  }`}
                                >
                                  <span
                                    className="flex size-[6.3cqw] shrink-0 items-center justify-center rounded-[1.75cqw]"
                                    style={{
                                      backgroundColor: `color-mix(in srgb, ${PANEL_COLORS[(i + ci + 1) % PANEL_COLORS.length]} 60%, white)`,
                                    }}
                                  >
                                    {createElement(
                                      getIconComponent(chip.icon),
                                      {
                                        className:
                                          "size-[3.5cqw] text-[#1e1e1e]",
                                        strokeWidth: 2,
                                        "aria-hidden": true,
                                      }
                                    )}
                                  </span>
                                  <span className="text-[2.66cqw] leading-tight font-medium text-[#1e1e1e]">
                                    {chip.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {data.cards.length > 1 && (
                    <div className="services_links-parent">
                      <div className="services_links-wrap">
                        {data.cards.map((card, i) => (
                          <a
                            key={card.tag}
                            href={`#showcase-card-${i + 1}`}
                            services-dot=""
                            aria-label={card.tag}
                            className={`services_link ${i === 0 ? "w--current" : ""}`.trim()}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
