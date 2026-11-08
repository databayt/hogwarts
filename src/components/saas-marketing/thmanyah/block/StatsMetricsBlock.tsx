"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { BookOpen, ChevronLeft, ChevronRight, Copy, Share } from "lucide-react"

import { useThmanyahLocale } from "@/components/saas-marketing/thmanyah/lib/copy"
import { REVEAL_SPRING } from "@/components/saas-marketing/thmanyah/lib/fonts"
import { usePhone } from "@/components/saas-marketing/thmanyah/lib/hooks"
import type { HomeScreen } from "@/components/saas-marketing/thmanyah/lib/screens"

/**
 * Trials — 1:1 mirror of font.thmanyah.com's "Trials" section
 * (.framer-1ns1rxg → .framer-1jtg0si-container → START component
 * .framer-V35Oc.framer-bkzjjz). Every declaration lives in globals.css
 * under `.trials-*`; this file only reproduces the reference DOM.
 *
 * The reference ships four SSR variants of the START component, and the
 * hydrated page keeps whichever one the breakpoint shows:
 *
 *   ≥1200     row · title (eyebrow / headline / lede + in-column "No.") on
 *             the right, JAMLIA Lottie on the left, 100vh, padding 60
 *   810–1199  same row, but the in-column "Numbers" box is empty (0px) and a
 *             separate wrapped "No." row sits at the bottom of the section
 *   600–809   row again (717px tall), in-column numbers present AND the
 *             separate "No." row below — the live site really shows the
 *             stats twice at this range; mirrored as-is
 *   <600      "START/Mob" column: eyebrow + headline, JAMLIA (316px) moved
 *             inside the title stack, lede 20px, then the "No." row
 *
 * The in-column numbers use "thmanyah sans" Bold; the separate row uses the
 * "thmanyah sans 1.2" Bold file, and its labels inherit the page's black
 * text colour (invisible on the black section) — both exactly as live.
 */

/* The strings live in `lib/copy.ts`; the notes that governed them stay here,
   because that is where the next person edits the section.

   STATS — the reference's three numbers are craft-effort counts (45 typefaces
   studied, 1,200 hours, 80 versions) — it sells to designers. Ours are SCOPE
   counts, because a school buyer can evaluate coverage but not our hours.
   Every one is understated against a figure verifiable in this repo, so the
   section can be fact-checked:
     60+  vs 62 feature modules shown as built/partial (of 101 defined) —
          SHOWN_FEATURES in saas-marketing/features/constants.tsx
     300+ vs 330 `model` declarations across prisma/models/*.prisma
     8    exactly — the UserRole enum (DEVELOPER · ADMIN · TEACHER ·
          STUDENT · GUARDIAN · ACCOUNTANT · STAFF · USER)
   Re-check before changing a digit. Deliberately NOT used: any count of
   schools or students served — `marketing.hero.badge` claims "+700 مدرسة
   مؤتمتة" with nothing in the repo behind it, and one unverifiable number
   in a credibility section costs you the other two.

   LEDES — the lede cycles, the way the reference's does. On
   font.thmanyah.com the whole START component is a Framer variant set —
   `ح / W`, `و / ً`, `ه / W` — and each variant ships its OWN lede describing
   that letterform's trial. The swap is enter-only: the outgoing paragraph is
   unmounted outright (its node stops existing) and the incoming one plays
   opacity 0 -> 1 with translateY 60 -> 0 under the same appear spring the
   rest of the page uses. Measured on the live site: no exit animation, no
   overshoot, ~1.4s to settle, variants held 2.3s / 2.8s / 4.2s — uneven
   because each hold is one Lottie letter's draw. Ours holds a uniform
   CYCLE_MS: the single jamlia loop has no per-letter segments to sync to, so
   a varying hold would be arbitrary.

   Three claims, each checkable in this repo and none of them repeating a stat
   cell below (the roles line lives there):
     RTL-native   -- every surface is authored right-to-left first; the shell
                     takes the route's direction (see the route's page.tsx)
     responsive   -- one component tree across the breakpoints, not a
                     stripped phone build; see the row/column variants this
                     very section carries
     offline      -- downloads + an outbox that drains through
                     /api/offline/sync
   Keep each under ~68 characters in BOTH locales: `.trials-lede-box` is a
   fixed 60px below 810px, which is exactly two lines at 20px/1.5em, and
   `.trials-title` is `overflow: clip` -- a third line vanishes with no
   warning. */

/** How long each lede is held before the next one takes its place. */
const CYCLE_MS = 4000

/* Where the reference draws its own letter (the JAMLIA Lottie), ours shows
   the platform on a phone — the real phone still from the demo school, in the
   page's language (lib/screens.ts). The JAMLIA boxes keep their geometry; the
   reference's `mix-blend-mode: color` on the row box is reset inline, because
   on a black band it would turn a photograph black (the stylesheet is
   unlayered, so a utility class cannot win). The screen stays inside the
   middle 84% of the box, clear of the Fade W band's top and bottom 8%. */
const SCREEN_BOX: React.CSSProperties = { mixBlendMode: "normal" }

function PhoneScreen({ screen }: { screen: HomeScreen }) {
  /* An iPhone 16e drawn around the still: its 71.5 x 146.7 mm body, a thin
     black bezel inside a graphite aluminium edge, and the notch the 16e keeps where newer models have the
     Dynamic Island. The still is the page area under Safari's bars, so the
     screen restores what the camera cut: the 9:41 status bar above it and
     Safari's address pill, toolbar and home indicator below it. Everything inside is
     sized in container units, so the phone scales as one object from the
     190px phone variant to the 300px desktop one. */
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="relative aspect-[715/1467] h-[84%] rounded-[15%/7.3%] bg-gradient-to-b from-[#5b5b60] via-[#3a3a3e] to-[#5b5b60] p-[1.1%] shadow-[0_0_90px_-20px_rgb(255_255_255/0.22)]"
        dir="ltr"
      >
        <div className="h-full w-full rounded-[14%/6.9%] bg-black p-[3%]">
          <div className="[container-type:inline-size] relative flex h-full w-full flex-col overflow-hidden rounded-[11%/5.2%] bg-white">
            <div
              aria-hidden
              className="absolute start-1/2 top-0 z-10 h-[8.6cqw] w-[41cqw] -translate-x-1/2 rounded-b-[5cqw] bg-black"
            />
            <div
              aria-hidden
              className="flex h-[12cqw] shrink-0 items-center justify-between px-[8cqw] pt-[1.5cqw] text-[4cqw] font-semibold text-black"
            >
              <span>9:41</span>
              <span className="flex items-center gap-[1.2cqw]">
                <span className="flex items-end gap-[0.5cqw]">
                  {[1.4, 2, 2.6, 3.2].map((h) => (
                    <span
                      key={h}
                      className="w-[0.8cqw] rounded-[0.3cqw] bg-black"
                      style={{ height: `${h}cqw` }}
                    />
                  ))}
                </span>
                <span className="relative h-[3cqw] w-[6cqw] rounded-[0.9cqw] border-[0.35cqw] border-black/40 p-[0.35cqw]">
                  <span className="block h-full w-[80%] rounded-[0.4cqw] bg-black" />
                </span>
              </span>
            </div>
            <picture className="contents">
              <source
                type="image/avif"
                srcSet={screen.avif}
                sizes="(max-width: 1199px) 175px, 275px"
              />
              <source
                type="image/webp"
                srcSet={screen.webp}
                sizes="(max-width: 1199px) 175px, 275px"
              />
              <img
                src={screen.src}
                alt={screen.alt}
                width={screen.width}
                height={screen.height}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full shrink-0"
              />
            </picture>
            <div
              aria-hidden
              className="flex min-h-0 flex-1 flex-col items-center justify-between bg-[#f2f2f7] px-[5cqw] pt-[3cqw] pb-[2cqw] text-[#007aff]"
            >
              <span className="flex h-[11cqw] w-full shrink-0 items-center justify-center rounded-full bg-white text-[3.8cqw] text-black shadow-[0_1px_3px_rgb(0_0_0/0.12)]">
                balqalam.com
              </span>
              <span className="flex w-full items-center justify-between px-[3cqw]">
                <ChevronLeft className="size-[6.5cqw]" />
                <ChevronRight className="size-[6.5cqw] opacity-40" />
                <Share className="size-[5.5cqw]" />
                <BookOpen className="size-[5.5cqw]" />
                <Copy className="size-[5.5cqw]" />
              </span>
              <span className="h-[1.3cqw] w-[36cqw] shrink-0 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const HIDDEN = { opacity: 0.001, y: 60, transformPerspective: 1200 }
const SHOWN = { opacity: 1, y: 0, transformPerspective: 1200 }

export function StatsMetricsBlock({ screen }: { screen: HomeScreen }) {
  const { copy } = useThmanyahLocale()
  const { stats: STATS, ledes: LEDES } = copy.trials
  const phone = usePhone()
  /* One trigger for the container and, on the phone variant, the lede: the
     live "START/Mob" lede carries its own appear effect (opacity 0 · y 60)
     that fires with the container's — while still clipped by the title box —
     and the row variants ship the lede static. */
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, amount: 0.5 })
  const shown = inView ? SHOWN : HIDDEN

  /* A SECOND, non-`once` observer drives the lede cycle, so the interval only
     runs while the section is actually on screen — the appear observer above
     latches on first reveal and can never turn anything back off. */
  const onScreen = useInView(containerRef, { amount: 0.3 })
  const [lede, setLede] = useState(0)
  useEffect(() => {
    if (!onScreen || LEDES.length < 2) return
    const id = window.setInterval(
      () => setLede((i) => (i + 1) % LEDES.length),
      CYCLE_MS
    )
    return () => window.clearInterval(id)
  }, [onScreen, LEDES.length])

  /* translateY is the vestibular trigger, not the crossfade — so a reduced-
     motion reader still gets all three ledes, they just fade rather than
     travel. */
  const reduced = useReducedMotion()
  const ledeHidden = reduced ? { opacity: 0.001 } : HIDDEN
  const ledeShown = reduced ? { opacity: 1 } : SHOWN

  return (
    <section className="trials-section" data-framer-name="Trials">
      {/* .framer-1jtg0si-container — appear target (opacity 0 · y 60 · perspective 1200) */}
      <motion.div
        ref={containerRef}
        className="trials-container"
        initial={HIDDEN}
        animate={shown}
        transition={REVEAL_SPRING}
      >
        {/* START component (.framer-V35Oc.framer-bkzjjz) */}
        <div className="trials-component" data-framer-name="START">
          {/* title (.framer-1inbwi3) */}
          <div className="trials-title" data-framer-name="title">
            {/* .framer-twcf6g */}
            <div className="trials-head">
              {/* .framer-vh2812 */}
              <div className="trials-head-group">
                <div className="trials-text">
                  <h2 className="trials-eyebrow">{copy.trials.eyebrow}</h2>
                </div>
                <div className="trials-text">
                  <p className="trials-headline">{copy.trials.headline}</p>
                </div>
              </div>
              <motion.div
                className="trials-text trials-lede-box"
                initial={phone ? HIDDEN : false}
                animate={phone ? shown : SHOWN}
                transition={REVEAL_SPRING}
              >
                {/* Keyed, so React unmounts the outgoing paragraph and mounts
                    a fresh one — which is what replays `initial` -> `animate`.
                    An AnimatePresence would add an exit the reference has
                    not got, and `mode="wait"` would leave the box empty
                    between ledes. */}
                <motion.p
                  key={lede}
                  className="trials-lede"
                  initial={ledeHidden}
                  animate={ledeShown}
                  transition={REVEAL_SPRING}
                >
                  {LEDES[lede]}
                </motion.p>
              </motion.div>
              {/* JAMLIA inside the title stack — START/Mob variant only
                  (.framer-1e23szr-container) */}
              <div
                className="trials-jamlia trials-jamlia--mob"
                data-framer-name="JAMLIA"
                aria-hidden={!phone}
                style={SCREEN_BOX}
              >
                <div className="trials-jamlia-inner">
                  {phone && <PhoneScreen screen={screen} />}
                </div>
              </div>
            </div>

            {/* Numbers (.framer-acqcv1) — the in-column stats */}
            <div className="trials-numbers" data-framer-name="Numbers">
              <div
                className="trials-no trials-no--inline"
                data-framer-name="No."
              >
                {STATS.map((s, i) => (
                  <div
                    key={s.number}
                    className="trials-cell"
                    data-framer-name={i === 0 ? "Cell 1" : "Cell 2"}
                  >
                    <div className="trials-text">
                      <p className="trials-cell-label">{s.prefix}</p>
                    </div>
                    <div className="trials-cell-body">
                      <div className="trials-text">
                        <h1 className="trials-cell-number" dir="auto">
                          {s.number}
                        </h1>
                      </div>
                      <div className="trials-text">
                        <p className="trials-cell-desc">{s.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fade W (.framer-1ixtn38) */}
          <div className="trials-fade" data-framer-name="Fade W" aria-hidden />

          {/* JAMLIA (.framer-1hqdotc-container) — row variants */}
          <div
            className="trials-jamlia trials-jamlia--row"
            data-framer-name="JAMLIA"
            aria-hidden={phone}
            style={SCREEN_BOX}
          >
            <div className="trials-jamlia-inner">
              {!phone && <PhoneScreen screen={screen} />}
            </div>
          </div>
        </div>
      </motion.div>

      {/* No. (.framer-163w8c0) — the separate wrapped row, <1200 only */}
      <div className="trials-no trials-no--row" data-framer-name="No.">
        {STATS.map((s, i) => (
          <div
            key={s.number}
            className="trials-row-cell"
            data-framer-name={i === 0 ? "Cell 1" : "Cell 2"}
          >
            <div className="trials-text">
              <p className="trials-row-label">{s.prefix}</p>
            </div>
            <div className="trials-cell-body">
              <div className="trials-text">
                <h1 className="trials-row-number" dir="auto">
                  {s.number}
                </h1>
              </div>
              <div className="trials-text">
                <p className="trials-row-desc">{s.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
