"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

import { LottiePlayer } from "@/components/saas-marketing/thmanyah/atom/LottiePlayer"
import { REVEAL_SPRING } from "@/components/saas-marketing/thmanyah/lib/fonts"
import { usePhone } from "@/components/saas-marketing/thmanyah/lib/hooks"

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

type Stat = { prefix: string; number: string; description: string }

/* The reference's three numbers are craft-effort counts (45 typefaces
   studied, 1,200 hours, 80 versions) — it sells to designers. Ours are
   SCOPE counts, because a school buyer can evaluate coverage but not our
   hours. Every one is understated against a figure verifiable in this repo,
   so the section can be fact-checked:
     60+  vs 62 feature modules shown as built/partial (of 101 defined) —
          SHOWN_FEATURES in saas-marketing/features/constants.tsx
     300+ vs 330 `model` declarations across prisma/models/*.prisma
     8    exactly — the UserRole enum (DEVELOPER · ADMIN · TEACHER ·
          STUDENT · GUARDIAN · ACCOUNTANT · STAFF · USER)
   Re-check before changing a digit. Deliberately NOT used: any count of
   schools or students served — `marketing.hero.badge` claims "+700 مدرسة
   مؤتمتة" with nothing in the repo behind it, and one unverifiable number
   in a credibility section costs you the other two. */
const STATS: Stat[] = [
  {
    prefix: "أكثر من",
    number: "60",
    description: "وحدة تغطي يوم المدرسة، من القبول إلى التقارير.",
  },
  {
    prefix: "أكثر من",
    number: "300",
    description: "نموذج بيانات تقوم عليها سجلات المدرسة وتقاريرها.",
  },
  {
    prefix: "تعمل بـ",
    number: "8",
    description: "أدوار، لكل دورٍ لوحته وما يخصّه وحده.",
  },
]

/* The lede cycles, the way the reference's does. On font.thmanyah.com the
   whole START component is a Framer variant set — `ح / W`, `و / ً`, `ه / W` —
   and each variant ships its OWN lede describing that letterform's trial. The
   swap is enter-only: the outgoing paragraph is unmounted outright (its node
   stops existing) and the incoming one plays opacity 0 -> 1 with translateY
   60 -> 0 under the same appear spring the rest of the page uses. Measured on
   the live site: no exit animation, no overshoot, ~1.4s to settle, variants
   held 2.3s / 2.8s / 4.2s — uneven because each hold is one Lottie letter's
   draw. Ours holds a uniform CYCLE_MS: the single jamlia loop has no
   per-letter segments to sync to, so a varying hold would be arbitrary.

   Three claims, each checkable in this repo and none of them repeating a stat
   cell below (the roles line lives there):
     RTL-native   -- every surface authored right-to-left; `dir` is pinned on
                     the shell, not inherited (see the route's page.tsx)
     responsive   -- one component tree across the breakpoints, not a
                     stripped phone build; see the row/column variants this
                     very section carries
     offline      -- downloads + an outbox that drains through
                     /api/offline/sync
   Keep each under ~68 characters: `.trials-lede-box` is a fixed 60px below
   810px, which is exactly two lines at 20px/1.5em, and `.trials-title` is
   `overflow: clip` -- a third line vanishes with no warning. */
const LEDES: string[] = [
  "صُمِّمت من اليمين إلى اليسار منذ أول سطر.",
  "من شاشة الهاتف إلى شاشة المكتب، الواجهة نفسها كاملة.",
  "تعمل دون اتصال، وتُزامن ما أُنجز حين تعود الشبكة.",
]

/** How long each lede is held before the next one takes its place. */
const CYCLE_MS = 4000

const JAMLIA_SRC = "/lottie/lottie-hero-ha.json"

const HIDDEN = { opacity: 0.001, y: 60, transformPerspective: 1200 }
const SHOWN = { opacity: 1, y: 0, transformPerspective: 1200 }

export function StatsMetricsBlock() {
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
  }, [onScreen])

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
                  <h2 dir="rtl" className="trials-eyebrow">
                    رحلة بناء
                  </h2>
                </div>
                <div className="trials-text">
                  <p dir="rtl" className="trials-headline">
                    منظومة عربية غير مسبوقة
                  </p>
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
                  dir="rtl"
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
              >
                <div className="trials-jamlia-inner">
                  {phone && <LottiePlayer src={JAMLIA_SRC} />}
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
                      <p className="trials-cell-label" dir="rtl">
                        {s.prefix}
                      </p>
                    </div>
                    <div className="trials-cell-body">
                      <div className="trials-text">
                        <h1 className="trials-cell-number" dir="auto">
                          {s.number}
                        </h1>
                      </div>
                      <div className="trials-text">
                        <p className="trials-cell-desc" dir="rtl">
                          {s.description}
                        </p>
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
          >
            <div className="trials-jamlia-inner">
              {!phone && <LottiePlayer src={JAMLIA_SRC} />}
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
              <p className="trials-row-label" dir="rtl">
                {s.prefix}
              </p>
            </div>
            <div className="trials-cell-body">
              <div className="trials-text">
                <h1 className="trials-row-number" dir="auto">
                  {s.number}
                </h1>
              </div>
              <div className="trials-text">
                <p className="trials-row-desc" dir="rtl">
                  {s.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
