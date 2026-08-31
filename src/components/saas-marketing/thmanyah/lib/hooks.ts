"use client"

import { useEffect, useState } from "react"

/**
 * Tracks a CSS media query. Starts `false` on the server and on the first
 * client render, then follows `matchMedia` — used where the reference swaps
 * whole subtrees per Framer breakpoint (e.g. a different Lottie file below
 * 600px) rather than restyling the same node.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const apply = () => setMatches(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [query])
  return matches
}

/** Framer's phone breakpoint on font.thmanyah.com: (max-width: 599.98px). */
export function usePhone(): boolean {
  return useMediaQuery("(max-width: 599.98px)")
}
