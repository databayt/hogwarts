"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"

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

const STATS: Stat[] = [
  {
    prefix: "دراسة أكثر من",
    number: "45",
    description: "خطًّا عربيًّا في سعينا لتصميم خط عربي أنيق ومميز.",
  },
  {
    prefix: "أكثر من",
    number: "1,200",
    description: "ساعة من البحث والتجارب للوصول إلى خط أصيل مرن فريد عصري.",
  },
  {
    prefix: "أكثر من",
    number: "80",
    description:
      // verbatim — the reference has two spaces before "تنسجم" and pre-wrap keeps them
      "نسخة من الخط مع تحسين مستمر للوصول إلى نسخة  تنسجم مع هوية ثمانية.",
  },
]

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
                    خــط عـربي غير مسبوق
                  </p>
                </div>
              </div>
              <motion.div
                className="trials-text trials-lede-box"
                initial={phone ? HIDDEN : false}
                animate={phone ? shown : SHOWN}
                transition={REVEAL_SPRING}
              >
                <p dir="rtl" className="trials-lede">
                  أصبح رسم حرف الحاء أكثر انسيابية، بزوايا حادة تعكس قوة الحرف
                  وحضوره.
                </p>
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
