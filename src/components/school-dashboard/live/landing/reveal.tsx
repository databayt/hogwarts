"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { motion, MotionConfig } from "framer-motion"

import { REVEAL_SPRING } from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * A scroll reveal for the one band that earns it.
 *
 * Deliberately thin: it takes `children` so everything inside stays a server
 * component and never hydrates — only this wrapper does.
 *
 * Deliberately rare, too. The marketing homepage reveals every band, which
 * reads well on a page you see once. This page is opened several times a
 * school day, and content that fades in on arrival reads as slow — so the
 * hero, the live strip and the readiness band paint immediately, and only the
 * "not set up yet" band, which an admin sees once and then never again,
 * animates.
 *
 * It animates on MOUNT, not on scroll. The shared `reveal()` helper uses
 * `whileInView`, which is right on a marketing page where every band is below
 * the fold — but this band is the FIRST thing an admin of a not-yet-online
 * school needs to read, and a `whileInView` element that never enters the
 * viewport stays at `opacity: 0.001` forever. Caught exactly that way: the
 * band rendered, occupied its full height, and showed nothing.
 *
 * `reducedMotion="user"` honours the OS setting; the spring is the same one
 * the homepage bands use, so the motion still matches the brand.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0.001, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={REVEAL_SPRING}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}
