"use client"

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"

import { LottiePlayer } from "@/components/saas-marketing/thmanyah/atom/LottiePlayer"
import {
  CDN_POSTERS,
  CDN_VIDEOS,
} from "@/components/saas-marketing/thmanyah/lib/cdn-assets"
import { reveal } from "@/components/saas-marketing/thmanyah/lib/fonts"
import { usePhone } from "@/components/saas-marketing/thmanyah/lib/hooks"

/**
 * مرن + "New design - wireframe" — 1:1 mirror of the second and third
 * children of font.thmanyah.com's "الصفـات" section:
 *
 *   .framer-1nmkaac "مرن"        100vh · padding 40 60 120 · a 1320x412 slot
 *                                 (.framer-ia48yy-container) holding the
 *                                 2970x1060 "Kashida" Lottie (1729x2180
 *                                 "Kashida_Mobile" below 600px)
 *   .framer-f1nocq > -16y31r2     the wireframe strip: one flex row
 *     > -18e3f0s "Section 1"      (column below 600px) of two flex:1 0 0
 *                                 columns, each a stack of aspect-ratio
 *                                 tiles — three Lotties on the right, a video
 *                                 + two Lotties on the left, both columns
 *                                 vertically centred, overflow clipped
 *
 * Every declaration lives in globals.css under `.marn-*` / `.wire-*`; this
 * file only reproduces the reference DOM. The five Lottie assets are still
 * the files the live page loads (md5-verified); the video tile is NOT — the
 * reference plays thmanyah's own brand and sub-brand wordmarks there, so it
 * was replaced with our own six-beat wordmark cycle, set in thmanyah sans:
 * بالقلم, then القبول · الحضور · الدرجات · الرسوم · افتراضي. Type only, no
 * mark. Each beat enters from the right, holds centred, exits left through
 * full black — the reference's own rhythm, six beats instead of four.
 */

const MARN_DESKTOP = "/lottie/lottie-hero-ha-v2.json" // Kashida 2970x1060
const MARN_PHONE = "/lottie/lottie-hero-ha-alt.json" // Kashida_Mobile 1729x2180

export function FeaturesBlock() {
  const phone = usePhone()
  const videoRef = useRef<HTMLVideoElement>(null)

  /* The wordmark loop is `preload="none"` and never autoplays: it only
     fetches and runs while it is actually on screen. Same reasoning as
     LottiePlayer's `playOnView` — this strip sits far down the page, and a
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
          <div
            className="marn-component"
            data-framer-name={phone ? "3" : "Variant 1"}
          >
            {/* .framer-1xmf9qe-container "MARN" — height auto, so the inline
                svg sits on a line box and the reference's 3px baseline gap
                below it is reproduced for free */}
            <div className="marn-lottie" data-framer-name="MARN">
              <LottiePlayer
                key={phone ? "phone" : "desktop"}
                src={phone ? MARN_PHONE : MARN_DESKTOP}
                className="marn-lottie-mount"
                loop={false}
                playOnView
              />
            </div>
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
                  <LottiePlayer src="/lottie/lottie-feature-1.json" />
                </div>
              </div>
              {/* .framer-14aaw2t */}
              <div className="wire-row">
                <div className="wire-tile wire-tile--2">
                  <div className="wire-fill">
                    <LottiePlayer src="/lottie/lottie-feature-2.json" />
                  </div>
                </div>
              </div>
              <div className="wire-tile wire-tile--3">
                <div className="wire-fill">
                  <LottiePlayer src="/lottie/lottie-feature-3.json" />
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
                  <LottiePlayer src="/lottie/lottie-feature-4.json" />
                </div>
              </div>
              <div className="wire-tile wire-tile--5">
                <div className="wire-fill">
                  <LottiePlayer src="/lottie/lottie-feature-5.json" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
