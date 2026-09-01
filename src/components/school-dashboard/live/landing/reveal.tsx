"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { motion, MotionConfig } from "framer-motion"

import { reveal } from "@/components/saas-marketing/thmanyah/lib/fonts"

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
 * `reducedMotion="user"` honours the OS setting; the shared `reveal()` spring
 * is the same one the homepage bands use, so the motion matches the brand.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div {...reveal(48, 0.3)}>{children}</motion.div>
    </MotionConfig>
  )
}
