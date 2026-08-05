// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Per-feature "Services" deck — the zenda sticky-card stack (GSAP scale +
// scroll-spy dots) parameterized with feature capability cards and real
// product screenshots. Runs under the `.zenda-clone` CSS scope; renders its
// own full-bleed cream band so it stays legible in dark mode.

"use client"

import { createElement, useEffect, useRef } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { getIconComponent } from "../icon-map"
import type { ShowcaseData } from "../types"

/** Pill color variants from the zenda scope, cycled by card index. */
const TAG_VARIANTS = ["", " is-autopay", " is-marketplace", " is-re-enrollment"]

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
    <div
      className="zenda-clone relative ml-[calc(50%-50vw)] w-screen overflow-x-clip"
      style={{ backgroundColor: "var(--background)" }}
    >
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
                {data.cards.map((card, i) => (
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
                            {/* dir=auto keeps English copy LTR inside the RTL page */}
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
                      <div
                        className="services_img-wrap"
                        style={{
                          border: "1px solid rgba(16, 24, 40, 0.08)",
                        }}
                      >
                        <Image
                          src={card.image}
                          alt={card.title}
                          width={card.width}
                          height={card.height}
                          sizes="(max-width: 767px) 100vw, 588px"
                          className="img-cover"
                        />
                      </div>
                    </div>
                  </div>
                ))}

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
  )
}
