"use client"

import React from "react"
import { motion } from "framer-motion"

import { tenantOriginForHost } from "@/lib/root-domain"
import { DemoLink } from "@/components/saas-marketing/demo-link"

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

/* Headline — the optimized form of marketing.hero.title
   ("المنظومة الشاملة لإدارة المدارس والعملية التعليمية"), width-matched to the
   reference so the swap is invisible:
   "نظام واحد يُدير أعمـال المدرسـة والتعليـم معًا" — one system runs the school's
   operations and teaching, together. المنظومة → نظام واحد · لإدارة المدارس →
   يُدير أعمـال المدرسـة · والعملية التعليمية → والتعليـم معًا.

   The brief is ZERO visual drift from the reference, so every flex item is
   width-tuned with tatweel to its reference twin at 92px (the reference
   itself tunes with tatweel in قـرّرنا/ثمانيــة/عربيًّــــا):
     نظام 169.8 vs لماذا 165 · واحد 169.3 vs قـرّرنا 170.6
     يُدير 129.6 vs في 139.9 (no valid tatweel slot — د breaks the join)
     أعمـال 242.7 vs ثمانيــة 246.5 · المدرسـة 322.1 vs أن نُصمم 324
     والتعليـم معًا 454.0 vs خطًّـا عربيًّــــا؟ 453.8
   Line 1 = 762.4 vs 773, line 2 = 793.1 vs 794.8 (max 840): identical
   2-line wrap ≥810px and identical 3-/4-line phone distribution below
   (أعمـال deliberately stays at ONE tatweel: a second one made tablet
   line 2 fit with 1.8px slack at exactly 600px wide — this keeps ~12px,
   matching the reference's own margins). The wrap container is
   min(432|840, 100vw − 2×section-padding); a 320px phone (280px) is the
   binding case — highlight 236.9 vs the reference's 237. */
const WORDS: Array<{ text: string; ss01?: boolean; name: string }> = [
  { text: "نظام", ss01: true, name: "27zag5" },
  { text: "واحد", ss01: true, name: "150tskc" },
  { text: "يُدير", ss01: true, name: "ldw5z9" },
  { text: "أعمـال", ss01: true, name: "pmu4ak" },
  { text: "المدرسـة", ss01: true, name: "1ayb9f3" },
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

/* SSR/first-paint href for the CTA. An explicit NEXT_PUBLIC_DEMO_URL wins;
   otherwise the primary root's demo tenant, which DemoLink re-resolves to the
   visitor's own root after mount. */
const DEMO_FALLBACK_HREF = `${
  process.env.NEXT_PUBLIC_DEMO_URL || tenantOriginForHost(null, "demo")
}/ar`

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
              منصة بالقلم
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
                  والتعليـم معًا
                </h1>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA (.framer-3lvoni) — points at the demo school rather than the
            reference's in-page anchor. DemoLink follows the visitor's root
            domain, so on balqalam.com it resolves to demo.balqalam.com, on
            ed.databayt.org to demo.databayt.org, and locally to
            demo.localhost:3000. The page is pinned Arabic, so is the demo.

            Label is "جرّب المنصة الآن" (try it now), not the reference's
            "احصل على الخط" / our earlier "احصل على المنصة": the button opens a
            live demo school, and "احصل على" promises a purchase the click does
            not deliver. Width-matched like the headline — the button is
            content-sized, and at 16px thmanyah sans it renders 170.1px against
            the reference's 166.9px (Δ +3.2), where "احصل على المنصة" sat at
            181.3px (Δ +14.4). Measured alternatives, same conditions:
            ادخل إلى المنصة 166.8 (Δ −0.1, but "enter" reads as sign-in) ·
            جرّب المنصة مجانًا 179.6 · استكشف المنصة 173.0 · جرّب المنصة 142.7. */}
        <motion.div {...APPEAR} className="hero-cta">
          <DemoLink
            fallbackHref={DEMO_FALLBACK_HREF}
            lang="ar"
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
              جرّب المنصة الآن
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
          </DemoLink>
        </motion.div>
      </section>
    </>
  )
}
