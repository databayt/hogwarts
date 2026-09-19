"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"

import { WordmarkWriting } from "@/components/saas-marketing/thmanyah/atom/WordmarkWriting"
import { CDN_IMAGES } from "@/components/saas-marketing/thmanyah/lib/cdn-assets"
import { useThmanyahLocale } from "@/components/saas-marketing/thmanyah/lib/copy"
import { reveal } from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * 1:1 mirror of the reference "The Answer" section (.framer-1ogfghp, id="2").
 *
 * Layout comes from the reference's own declarations (read off its CSSOM),
 * not from eyeballed numbers - see the .answer-* rules in globals.css:
 *   media : width 52% . height 76vh   -> 967x821 @1920, 634x684 @1280
 *   text  : flex 1 0 0px              -> takes the remainder (817 / 510)
 *   row   : max-height 824px . gap 76px . padding-right 60 (A) / left 60 (B)
 *   "8"   : height 100vh (not 16:9) — now the بالقلم word, not the Lottie
 * Rows stack below 1200px, and below 600px the reference collapses row B's
 * image to 0px height; that quirk is mirrored in globals.css.
 */
/* `start`, not `right` — the shell carries the route's direction now, and
   under `dir=rtl` the two compute identically. */
const TEXT_STYLE: React.CSSProperties = {
  fontFamily: '"thmanyah sans", sans-serif',
  fontWeight: 300,
  color: "#000",
  textAlign: "start",
}

const APPEAR = reveal(60, 0.5)

export function StoryNarrativeBlock() {
  const { copy } = useThmanyahLocale()
  const eightRef = useRef<HTMLDivElement>(null)
  /* not `once` — the write loops, so it should stop while off screen */
  const eightInView = useInView(eightRef, { amount: 0.4 })

  return (
    <div className="answer-section" data-framer-name="The Answer" id="2">
      {/* Inner wrapper (.framer-1tx7snx) — gap 0, so the section's 80px gap
          never renders between the rows, exactly as on the reference. */}
      <div className="answer-inner">
        {/* Row A (.framer-1rkxe1n) */}
        <div className="answer-row answer-row--a" data-framer-name="Row A">
          {/* Text (.framer-1n6arzq) */}
          <motion.div {...APPEAR} className="answer-text answer-text--a">
            <h2 style={TEXT_STYLE}>
              {copy.answer.a[0]}
              <br />
              <br />
              {copy.answer.a[1]}
            </h2>
          </motion.div>

          {/* Arabic Letter (.framer-1mprlpy) */}
          <div
            className="answer-media answer-media--a"
            data-framer-name="Arabic Letter"
          >
            <picture>
              <source
                srcSet={CDN_IMAGES["ha-compare-1"].avif}
                type="image/avif"
                sizes="(max-width: 1199px) 100vw, 50vw"
              />
              <source
                srcSet={CDN_IMAGES["ha-compare-1"].webp}
                type="image/webp"
                sizes="(max-width: 1199px) 100vw, 50vw"
              />
              <img
                src={CDN_IMAGES["ha-compare-1"].webp}
                alt=""
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </picture>
          </div>
        </div>

        {/* 8 (.framer-avjrr4) — the full-bleed brand word.
            The reference writes ثمانية here with a Lottie; that file is 80
            baked outline layers with no text in it, so it cannot be
            retargeted to بالقلم. WordmarkWriting rebuilds the same idea from
            the real font outlines — see its header. The panel's mint ground
            came from the Lottie's own "Pale Green Solid" layer and is now
            CSS on the wrapper. */}
        <div className="answer-eight" data-framer-name="بالقلم" id="8">
          <div ref={eightRef} className="answer-lottie overflow-hidden">
            <div className="answer-eight-word">
              <WordmarkWriting playing={eightInView} />
            </div>
          </div>
        </div>

        {/* Row B (.framer-1ukmi88) */}
        <div className="answer-row answer-row--b" data-framer-name="Row B">
          {/* Content represnent us (.framer-izlaqb) */}
          <div
            className="answer-media answer-media--b"
            data-framer-name="Content represnent us"
          >
            <picture>
              <source
                srcSet={CDN_IMAGES["ha-compare-2"].avif}
                type="image/avif"
                sizes="(max-width: 1199px) 100vw, 50vw"
              />
              <source
                srcSet={CDN_IMAGES["ha-compare-2"].webp}
                type="image/webp"
                sizes="(max-width: 1199px) 100vw, 50vw"
              />
              <img
                src={CDN_IMAGES["ha-compare-2"].webp}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </picture>
          </div>

          {/* Text (.framer-17jeuwe) */}
          <motion.div {...APPEAR} className="answer-text answer-text--b">
            {/* Body and closer are single strings, so the rendered h2 has
                exactly two child nodes (text + span) like the reference, with
                the trailing U+00A0 inside the text node rather than as its
                own child. */}
            <h2 style={TEXT_STYLE}>
              {copy.answer.bBody}
              <span
                className="font-medium text-black"
                style={{
                  fontFamily: '"thmanyah sans", sans-serif',
                  fontWeight: 500,
                }}
              >
                {copy.answer.bBold}
              </span>
            </h2>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
