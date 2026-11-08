"use client"

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"

import {
  FacesTile,
  GlyphGridTile,
  RulesTile,
  SyncTile,
  WordsTile,
} from "@/components/saas-marketing/thmanyah/atom/KineticTile"
import { StretchWord } from "@/components/saas-marketing/thmanyah/atom/StretchWord"
import {
  CDN_POSTERS,
  CDN_VIDEOS,
} from "@/components/saas-marketing/thmanyah/lib/cdn-assets"
import { useThmanyahLocale } from "@/components/saas-marketing/thmanyah/lib/copy"
import { reveal } from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * مرن + "New design - wireframe" — the second and third children of
 * font.thmanyah.com's "الصفـات" section, kept 1:1 in layout and rebuilt in
 * content:
 *
 *   .framer-1nmkaac "مرن"        100vh · padding 40 60 120 · a 1320x412 slot.
 *                                 The reference's "Kashida" Lottie (its font
 *                                 stretching «مرن يمتد حسب تعبيرك.») is now
 *                                 StretchWord: «مرن يمتد حسب مدرستك.» as live
 *                                 text whose kashida grows on entry.
 *   .framer-f1nocq > -16y31r2     the wireframe strip: two flex:1 columns of
 *     > -18e3f0s "Section 1"      aspect-ratio tiles (column below 600px).
 *                                 The five font-demo Lotties are now kinetic
 *                                 type tiles (atom/KineticTile) in the same
 *                                 slots and colours — bilingual words, the
 *                                 school's numbers, one grade in three faces,
 *                                 the school's own rules, the offline outbox.
 *                                 The video tile is our six-beat wordmark
 *                                 cycle (بالقلم · القبول · الحضور · الدرجات ·
 *                                 الرسوم · افتراضي), unchanged.
 *
 * Geometry lives in thmanyah-clone.css under `.marn-*` / `.wire-*`; the new
 * type under `.marn-words` / `.kt-*`. No Lottie loads here any more.
 */

export function FeaturesBlock() {
  const { rtl, copy } = useThmanyahLocale()
  const t = copy.traits
  const videoRef = useRef<HTMLVideoElement>(null)

  /* The wordmark loop is `preload="none"` and never autoplays: it only
     fetches and runs while it is actually on screen. Same reasoning as
     the kinetic tiles' on-screen ticker — this strip sits far down the page, and a
     decoder looping behind content nobody has scrolled to is pure cost. */
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* مرن (.framer-1nmkaac) */}
      <div className="marn-section" data-framer-name="مرن">
        {/* .framer-ia48yy-container — appear target */}
        <motion.div className="marn-slot" {...reveal(60, 0.5)}>
          {/* .framer-heabf.framer-16kzhtp "Variant 1" / "3" */}
          <div className="marn-component" data-framer-name="Variant 1">
            <StretchWord key={rtl ? "ar" : "en"} lines={t.marn} rtl={rtl} />
          </div>
        </motion.div>
      </div>

      {/* .framer-f1nocq */}
      <div className="wire-wrap">
        {/* .framer-16y31r2 "New design - wireframe" */}
        <div className="wire-strip" data-framer-name="New design - wireframe">
          {/* .framer-18e3f0s "Section 1" */}
          <div className="wire-section" data-framer-name="Section 1">
            {/* .framer-99wt5w — first column (right in RTL) */}
            <div className="wire-col wire-col--a">
              <div className="wire-tile wire-tile--1">
                <div className="wire-fill">
                  <WordsTile words={t.words} />
                </div>
              </div>
              {/* .framer-14aaw2t */}
              <div className="wire-row">
                <div className="wire-tile wire-tile--2">
                  <div className="wire-fill">
                    <GlyphGridTile glyphs={t.glyphs} />
                  </div>
                </div>
              </div>
              <div className="wire-tile wire-tile--3">
                <div className="wire-fill">
                  <FacesTile word={t.faces.word} roles={t.faces.roles} />
                </div>
              </div>
            </div>

            {/* .framer-14mux3i — second column (left in RTL) */}
            <div className="wire-col wire-col--b">
              <div className="wire-tile wire-tile--video">
                <video
                  ref={videoRef}
                  className="wire-video"
                  src={CDN_VIDEOS["balqalam-wordmarks-mp4"]}
                  poster={CDN_POSTERS["balqalam-wordmarks-poster"]}
                  loop
                  muted
                  playsInline
                  preload="none"
                />
              </div>
              <div className="wire-tile wire-tile--4">
                <div className="wire-fill">
                  <RulesTile rules={t.rules} />
                </div>
              </div>
              <div className="wire-tile wire-tile--5">
                <div className="wire-fill">
                  <SyncTile states={t.sync} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
