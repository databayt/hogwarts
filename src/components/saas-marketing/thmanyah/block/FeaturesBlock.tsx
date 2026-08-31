"use client"

import React from "react"
import { motion } from "framer-motion"

import { LottiePlayer } from "@/components/saas-marketing/thmanyah/atom/LottiePlayer"
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
 * file only reproduces the reference DOM. The Lottie/video assets are the
 * same files the live page loads (md5-verified).
 */

const MARN_DESKTOP = "/lottie/lottie-hero-ha-v2.json" // Kashida 2970x1060
const MARN_PHONE = "/lottie/lottie-hero-ha-alt.json" // Kashida_Mobile 1729x2180

export function FeaturesBlock() {
  const phone = usePhone()

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
                  className="wire-video"
                  src="/videos/wireframe.mp4"
                  poster="/images/wireframe-video-poster.png"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
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
