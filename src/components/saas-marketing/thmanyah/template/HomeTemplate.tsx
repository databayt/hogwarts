"use client"

import React from "react"
import { motion, MotionConfig } from "framer-motion"

import { CalligraphyComparisonBlock } from "@/components/saas-marketing/thmanyah/block/CalligraphyComparisonBlock"
import { DownloadCtaBlock } from "@/components/saas-marketing/thmanyah/block/DownloadCtaBlock"
import { FaqBlock } from "@/components/saas-marketing/thmanyah/block/FaqBlock"
import { FeaturesBlock } from "@/components/saas-marketing/thmanyah/block/FeaturesBlock"
import { FontFamiliesBlock } from "@/components/saas-marketing/thmanyah/block/FontFamiliesBlock"
import { FooterBlock } from "@/components/saas-marketing/thmanyah/block/FooterBlock"
import { HeroBlock } from "@/components/saas-marketing/thmanyah/block/HeroBlock"
import { InteractiveTesterBlock } from "@/components/saas-marketing/thmanyah/block/InteractiveTesterBlock"
import { ModernShowcaseBlock } from "@/components/saas-marketing/thmanyah/block/ModernShowcaseBlock"
import { StatsMetricsBlock } from "@/components/saas-marketing/thmanyah/block/StatsMetricsBlock"
import { StoryNarrativeBlock } from "@/components/saas-marketing/thmanyah/block/StoryNarrativeBlock"
import { reveal } from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * Page skeleton — a 1:1 mirror of font.thmanyah.com's top-level section
 * list (children of `.framer-4r0p4`):
 *
 *   Trigger · Hero · The Answer · Trials · الصفـات · Try · Modern · FAQ · Footer
 *
 * `الصفـات` holds اصيل + مرن + the wireframe strip, `Try` holds the
 * families accordion + the tester + its trigger anchor, and `Footer` holds
 * the mint CTA card + the bottom bar — exactly as the reference nests them,
 * so every section measures 1:1 against its live counterpart.
 */
export function HomeTemplate() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="page-wrap">
        {/* Trigger + Hero (.framer-1hxa3yr / .framer-23p5c9) */}
        <HeroBlock />

        {/* The Answer (.framer-1ogfghp) */}
        <StoryNarrativeBlock />

        {/* Trials (.framer-1ns1rxg) */}
        <StatsMetricsBlock />

        {/* الصفـات (.framer-1yhopfz): اصيل · مرن · New design - wireframe */}
        <section
          id="الصفـات"
          className="traits-section"
          data-framer-name="الصفـات"
        >
          <CalligraphyComparisonBlock />
          <FeaturesBlock />
        </section>

        {/* Try (.framer-b9uyjp): #8-fonts · tester · Trigger #tyt */}
        <section className="try-section" data-framer-name="Try">
          <FontFamiliesBlock />
          <InteractiveTesterBlock />
          <div
            id="tyt"
            className="try-trigger"
            data-framer-name="Trigger"
            aria-hidden
          />
        </section>

        {/* Modern (.framer-1lwlxn7) */}
        <ModernShowcaseBlock />

        {/* FAQ (.framer-808h3m) */}
        <FaqBlock />

        {/* Footer (.framer-scq2lf): CTA card · bottom bar */}
        <motion.section
          id="footer"
          className="footer-section"
          data-framer-name="Footer"
          {...reveal(60, 0.5)}
        >
          <DownloadCtaBlock />
          <FooterBlock />
        </motion.section>
      </main>
    </MotionConfig>
  )
}
