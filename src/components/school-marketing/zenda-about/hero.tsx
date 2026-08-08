// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/hero) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css). The flip cards stay PARENT/SCHOOL: the card
// faces ARE letter artwork, so the two pill words are art-locked.

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AboutHeroCards } from "./hero-cards"

/**
 * About hero — "Who are we". A faithful port of zenda.com/about-us' hero: an
 * eyebrow tag, a heading with two inline pill buttons (parents | schools), and a
 * fanned row of six flip cards. The cards spell PARENT on the front and SCHOOL on
 * the back; hovering a button (or a card) flips all six. The flip choreography
 * lives in <AboutHeroCards/> (GSAP), which targets the `hero-btn-parents` /
 * `hero-btn-schools` buttons and the `hero-card` items tagged below.
 */

type Face = { src: string; letter: string; cls?: string }
type Card = { n: number; front: Face; back: Face }

// Front faces spell PARENT, back faces spell SCHOOL. Each `cls` is the colour
// modifier the reference applies to that face (the first front/back carry the
// base colours, so they have none).
const CARDS: Card[] = [
  {
    n: 1,
    front: { src: "/images/about/parent-p.webp", letter: "P" },
    back: { src: "/images/about/school-s.webp", letter: "S" },
  },
  {
    n: 2,
    front: { src: "/images/about/parent-a.webp", letter: "A", cls: "is-a" },
    back: { src: "/images/about/school-c.webp", letter: "C", cls: "is-c" },
  },
  {
    n: 3,
    front: { src: "/images/about/parent-r.webp", letter: "R", cls: "is-r" },
    back: { src: "/images/about/school-h.webp", letter: "H", cls: "is-h" },
  },
  {
    n: 4,
    front: { src: "/images/about/parent-e.webp", letter: "E", cls: "is-e" },
    back: { src: "/images/about/school-o1.webp", letter: "O", cls: "is-o" },
  },
  {
    n: 5,
    front: { src: "/images/about/parent-n.webp", letter: "N", cls: "is-n" },
    back: {
      src: "/images/about/school-o2.webp",
      letter: "O",
      cls: "is-o-second",
    },
  },
  {
    n: 6,
    front: { src: "/images/about/parent-t.webp", letter: "T", cls: "is-t" },
    back: { src: "/images/about/school-l.webp", letter: "L", cls: "is-l" },
  },
]

export function Hero({ dictionary }: { dictionary?: Dictionary }) {
  const t = dictionary?.marketing?.site?.about?.hero
  return (
    <header className="section_about-hero">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="about-hero_wrap">
            <div className="about-hero_header">
              <div className="tag is-text">{t?.eyebrow ?? "Who are we"}</div>
              <div className="padding-bottom padding-xsmall" />
              <h1 className="about-hero_heading">
                <span className="about-hero_inline">
                  {t?.heading ??
                    "We are educators devoted to those who raise tomorrow - The nurturers -"}
                </span>
                {/* PARENT/SCHOOL pill buttons are art-locked, not sourced from
                    the dictionary — the card faces are letter artwork spelling
                    these exact words, so translating the label would break the
                    reader's link to what the flip reveals. See file header. */}
                <button
                  type="button"
                  hero-btn-parents=""
                  className="about-hero_btn is-active"
                >
                  <div>parents</div>
                </button>
                <span className="about-hero_inline">&amp;</span>
                <button
                  type="button"
                  hero-btn-schools=""
                  className="about-hero_btn is-schools"
                >
                  <div>schools</div>
                </button>
              </h1>
            </div>

            <div className="padding-bottom padding-huge" />

            <div className="about-hero_list">
              {CARDS.map(({ n, front, back }) => (
                <div
                  key={n}
                  card-component=""
                  className={`about-hero_card_component is-${n}`}
                >
                  <div hero-card="" className="about-hero_card_item">
                    <div className={`about-hero_card_front ${front.cls ?? ""}`}>
                      <div className="about-hero_card_img-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={front.src}
                          alt={front.letter}
                          className="img-auto"
                          loading="eager"
                        />
                      </div>
                    </div>
                    <div className={`about-hero_card_back ${back.cls ?? ""}`}>
                      <div className="about-hero_card_img-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={back.src}
                          alt={back.letter}
                          className="img-auto"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AboutHeroCards />
    </header>
  )
}
