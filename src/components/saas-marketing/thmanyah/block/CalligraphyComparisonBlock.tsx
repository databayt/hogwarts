"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"

/**
 * سجلٌّ أصيل — the reference's "الصفـات" section, mechanics untouched.
 *
 * The reference wipes from a master calligrapher's manuscript to the same
 * words set in its typeface — "as if a calligrapher wrote it". Ours keeps
 * that exact rhetoric one step over: the familiar paper register wipes away
 * to the same day held in the system, so the headline can still open with
 * "كما لو أن". Copy width-matched at the reference's own sizes: eyebrow
 * 100.7px vs 88.1 (24px), headline 398 vs 376.6 (44px/900), and the lede
 * stays one line in the 1320px box.
 *
 * IMAGES ARE STILL THE REFERENCE'S. `/images/calligraphy-manuscript-{1,2}`
 * are thmanyah's manuscript photographs and must be replaced before this is
 * customer-facing — see the note at the images below.
 *
 * The frame is sticky and the sibling spacer supplies the scroll runway. As
 * the runway is consumed the mask translates left while the card inside it
 * counter-translates by the same amount, so the "before" image stays visually
 * pinned while its window slides away — wiping right-to-left to reveal the
 * "after" image underneath. Geometry lives in globals.css (`.aseel-*`).
 */

/* Wipe travel measured off the reference: it deliberately over-travels past
   the card width, so the reveal completes before the runway ends and then
   holds. */
const TRAVEL_DESKTOP = 1600
const TRAVEL_PHONE = 500

export function CalligraphyComparisonBlock() {
  const spacerRef = useRef<HTMLDivElement>(null)
  /* Read the breakpoint on first render too: initialising to the desktop
     travel would paint one over-wiped frame on a phone that loads part-way
     into the runway (an anchor jump, or a restored scroll position). */
  const [travel, setTravel] = useState(() =>
    typeof window !== "undefined" &&
    !window.matchMedia("(min-width: 600px)").matches
      ? TRAVEL_PHONE
      : TRAVEL_DESKTOP
  )

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 600px)")
    const apply = () => setTravel(mq.matches ? TRAVEL_DESKTOP : TRAVEL_PHONE)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  /* The reference starts the wipe when the frame's bottom reaches the bottom
     of the viewport, and runs it across exactly one spacer-height of scroll.
     Anchoring the range to the spacer expresses both in one rule: at >=600
     the frame is 100vh, so "spacer enters the viewport" is the moment the
     frame pins; below 600 the frame is shorter than the viewport and the wipe
     is already part-way along by the time it pins — which is what the
     reference does, and it tracks viewport height rather than being fixed. */
  const { scrollYProgress } = useScroll({
    target: spacerRef,
    offset: ["start end", "end end"],
  })

  const x = useTransform(scrollYProgress, [0, 1], [0, -travel])
  const xCounter = useTransform(x, (v) => -v)

  return (
    <div dir="rtl" className="aseel-inner" data-framer-name="اصيل">
      <div className="aseel-frame" data-framer-name="Frame">
        {/* title (.framer-33f5si) */}
        <div id="jamal" className="aseel-title" data-framer-name="title">
          <div className="aseel-title-group">
            <div className="aseel-eyebrow-box">
              <h2 dir="rtl" className="aseel-eyebrow">
                سجلٌّ أصيل
              </h2>
            </div>
            <div className="aseel-headline-box">
              <p dir="rtl" className="aseel-headline">
                كما لو أن الورق لم يتغيّر.
              </p>
            </div>
          </div>
          <div className="aseel-lede-box">
            <p dir="rtl" className="aseel-lede">
              يجمع بين أُلفة الورق ودقّة النظام، فلا يضيع سطرٌ ولا يُعاد كتابته.
            </p>
          </div>
        </div>

        {/* images (.framer-11ecfwm)
            PLACEHOLDER ASSETS — both photographs are still thmanyah's
            calligraphy manuscripts, so the wipe currently shows handwriting
            rather than a school. Replacing them needs two shots at the
            reference's exact dimensions, or the sticky wipe's travel is off:
              before  /images/*-1.png      1547x756  + -1-phone.png 788x752
              after   /images/*-2.png      1547x756  + -2-phone.png 788x756
            "before" wants a photo of a paper attendance/grades register;
            "after" wants the matching screen. NOTE the existing product
            shots in public/features/shots/ are 1280x1000 — a different
            aspect, so they cannot be dropped in without re-cropping. */}
        <div className="aseel-images" data-framer-name="Images">
          {/* after — revealed as the mask above it wipes away */}
          <div className="aseel-card" data-framer-name="بمنظومة بالقلم">
            {/* the reference swaps to a near-square phone crop below 600 */}
            <div className="aseel-media aseel-media--phone">
              <Image
                src="/images/calligraphy-manuscript-2-phone.png"
                alt="بمنظومة بالقلم"
                width={788}
                height={756}
                sizes="calc(100vw - 40px)"
                priority
                unoptimized
              />
            </div>
            <div className="aseel-media aseel-media--wide">
              <Image
                src="/images/calligraphy-manuscript-2.png"
                alt="بمنظومة بالقلم"
                width={1547}
                height={756}
                sizes="min(100vw - 120px, 1440px)"
                priority
                unoptimized
              />
            </div>
            <div
              className="aseel-pill aseel-pill--after"
              data-framer-name="After Title"
            >
              <p dir="rtl" className="aseel-pill-text">
                بمنظومة بالقلم
              </p>
            </div>
          </div>

          {/* before — clipped by the sliding mask, counter-translated to stay put */}
          <motion.div className="aseel-mask" style={{ x }}>
            <motion.div
              className="aseel-card-before"
              style={{ x: xCounter }}
              data-framer-name="بالورق والدفاتر"
            >
              {/* the reference swaps to a near-square phone crop below 600 */}
              <div className="aseel-media aseel-media--phone">
                <Image
                  src="/images/calligraphy-manuscript-1-phone.png"
                  alt="بالورق والدفاتر"
                  width={788}
                  height={752}
                  sizes="calc(100vw - 40px)"
                  priority
                  unoptimized
                />
              </div>
              <div className="aseel-media aseel-media--wide">
                <Image
                  src="/images/calligraphy-manuscript-1.png"
                  alt="بالورق والدفاتر"
                  width={1547}
                  height={756}
                  sizes="min(100vw - 120px, 1440px)"
                  priority
                  unoptimized
                />
              </div>
              <div
                className="aseel-pill aseel-pill--before"
                data-framer-name="Before Title"
              >
                <p dir="rtl" className="aseel-pill-text">
                  بالورق والدفاتر
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Spacing (.framer-1j333s7) — the sticky frame's runway */}
      <div
        id="أصيل"
        ref={spacerRef}
        className="aseel-spacer"
        aria-hidden="true"
      />
    </div>
  )
}
