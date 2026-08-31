"use client"

import React from "react"
import { motion } from "framer-motion"

/**
 * 1:1 mirror of the reference hero (.framer-23p5c9) — no site header.
 *
 * Reference computed values (1920×1080, ≥1200 breakpoint):
 *   hero   : 100vh · flex col · space-between · align center · padding 132px 60px 60px · #00bc6d
 *   text   : 1320px max · flex col · gap 24px · align flex-start (RTL → right)
 *   sub h3 : thmanyah sans 400 · 24px/36px · right
 *   words  : 840px max · flex row wrap · gap 10px 17px · align center
 *   h1     : thmanyah serif display 900 · 92px (80px at 1200–1439) · line-height 1.4 · ss01
 *   mark   : absolute top 28px bottom 26px left 1px right -1px · #9fe5b1 · no radius
 *   cta    : 1320px · button 40px h · padding 0 16px · radius 20px · gap 10px · #000
 *   label  : thmanyah sans 400 · 16px/24px · #fff ; icon 20×20 · bounce translateY
 */

const H1_STYLE: React.CSSProperties = {
  fontFamily: '"thmanyah serif display", serif',
  fontWeight: 900,
  lineHeight: "1.4em",
  fontFeatureSettings: '"ss01" on',
  color: "#000",
  textAlign: "right",
}

const WORDS: Array<{ text: string; ss01?: boolean; name: string }> = [
  { text: "لماذا", ss01: true, name: "27zag5" },
  { text: "قـرّرنا", ss01: true, name: "150tskc" },
  { text: "في", ss01: true, name: "ldw5z9" },
  { text: "ثمانيــة", ss01: true, name: "pmu4ak" },
  { text: "أن نُصمم", ss01: false, name: "1ayb9f3" },
]

/* From the reference's __framer__appearAnimationsContent: every hero block
   fades in from perspective(1200px) translateY(100px) — the subtitle from
   50px — over 1.2s with ease [0.45, 0.4, 0.17, 0.82] and no delay. */
const EASE: [number, number, number, number] = [0.45, 0.4, 0.17, 0.82]
const APPEAR = {
  initial: { opacity: 0.001, y: 100, transformPerspective: 1200 },
  animate: { opacity: 1, y: 0, transformPerspective: 1200 },
  transition: { duration: 1.2, ease: EASE, type: "tween" as const },
}
const APPEAR_SUB = {
  initial: { opacity: 0.001, y: 50, transformPerspective: 1200 },
  animate: { opacity: 1, y: 0, transformPerspective: 1200 },
  transition: { duration: 1.2, ease: EASE, type: "tween" as const },
}

export function HeroBlock() {
  return (
    <>
      {/* Trigger anchor (.framer-1hxa3yr): absolute, top 78px, 437px tall */}
      <div
        id="خط-ثمانيـة"
        className="pointer-events-none absolute inset-x-0 top-[78px] z-[1] h-[437px]"
        data-framer-name="Trigger"
        aria-hidden
      />

      {/* Hero (.framer-23p5c9) */}
      <section
        className="hero-section relative z-0 flex h-screen w-full flex-col items-center justify-between overflow-hidden bg-[#00bc6d]"
        data-framer-name="Hero"
      >
        {/* Text (.framer-1htsxxd) */}
        <motion.div
          {...APPEAR}
          className="hero-text will-change-transform"
          data-framer-name="Text"
        >
          {/* Subtitle (.framer-1y9s2py) */}
          <motion.div {...APPEAR_SUB} className="w-full">
            <h3
              dir="rtl"
              className="hero-title w-full text-right text-black"
              style={{
                fontFamily: '"thmanyah sans", sans-serif',
                fontWeight: 400,
                fontFeatureSettings:
                  '"blwf" on, "cv09" on, "cv03" on, "cv04" on, "cv11" on',
              }}
            >
              خط ثمانيــة
            </h3>
          </motion.div>

          {/* Words (.framer-ht94lv): row-wrap, 840px, gap 10px 17px */}
          <div
            dir="rtl"
            className="hero-words flex w-full flex-row flex-wrap items-center justify-start"
            data-framer-name="Words"
          >
            {WORDS.map((w) => (
              <div key={w.name} className="flex flex-col">
                <h1
                  dir="rtl"
                  style={{
                    ...H1_STYLE,
                    fontFeatureSettings: w.ss01 ? '"ss01" on' : "normal",
                  }}
                >
                  {w.text}
                </h1>
              </div>
            ))}

            {/* Highlight group (.framer-115xp5q) */}
            <div className="relative flex flex-row items-center justify-center gap-[10px]">
              {/* Mark (.framer-whameh) */}
              <motion.div
                {...APPEAR}
                className="hero-mark origin-right"
                aria-hidden
              />
              <div className="relative flex flex-col">
                <h1 dir="rtl" style={H1_STYLE}>
                  خطًّـا عربيًّــــا؟
                </h1>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA (.framer-3lvoni) */}
        <motion.div {...APPEAR} className="hero-cta">
          <a
            href="#footer"
            data-framer-name="Button"
            className="inline-flex h-10 flex-row items-center justify-center gap-[10px] rounded-[20px] bg-black px-4 no-underline"
          >
            <p
              dir="rtl"
              className="text-[16px] leading-[24px] text-white"
              style={{
                fontFamily: '"thmanyah sans", sans-serif',
                fontWeight: 400,
                fontFeatureSettings:
                  '"blwf" on, "cv09" on, "cv03" on, "cv04" on, "cv11" on',
              }}
            >
              احصل على الخط
            </p>
            <motion.span
              className="block h-5 w-5 shrink-0 will-change-transform"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="block h-full w-full"
                fill="#fff"
              >
                <path d="M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L120,196.69V40a8,8,0,0,1,16,0V196.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z" />
              </svg>
            </motion.span>
          </a>
        </motion.div>
      </section>
    </>
  )
}
