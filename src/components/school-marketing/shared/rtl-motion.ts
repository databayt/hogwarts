// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Direction-aware GSAP offsets for the zenda clone.
 *
 * The stylesheet mirrors itself under RTL (scope-zenda.mjs emits logical
 * properties plus a `.zenda-clone[dir="rtl"]` overlay), but GSAP's `x` and
 * `xPercent` are written straight to `transform: translateX(…)` in physical
 * pixels. Nothing in CSS can reach them. So a card authored to slide in "from
 * the left" keeps sliding in from the left on an Arabic page whose layout now
 * runs the other way — it enters from the far side of where it belongs and
 * crosses the content on its way in.
 *
 * `mx()` negates an AUTHORED offset when the document runs right-to-left.
 *
 * It must NOT be used on a MEASURED value. Anything derived from
 * `getBoundingClientRect()` — the homepage intro's `logoToCentre`, the academic
 * page's merge flyer — is already expressed in the mirrored coordinate space,
 * because the rect it came from was measured after the mirror applied. Negating
 * such a value sends the element the wrong way by exactly twice the distance.
 * The rule is simple: flip the numbers a human typed, never the ones the
 * browser reported.
 *
 * Read at call time, not at module scope: these run inside `useEffect`, and a
 * module-level constant would be evaluated during import — before hydration
 * has necessarily settled `<html dir>`, and shared across a client-side
 * navigation that changes locale.
 */

/** -1 when the document runs right-to-left, 1 otherwise. */
export function rtlSign(): -1 | 1 {
  if (typeof document === "undefined") return 1
  return document.documentElement.dir === "rtl" ? -1 : 1
}

/**
 * Mirror an authored horizontal offset. Accepts the two forms zenda's tweens
 * use — a number (px) and a CSS length/percentage string ("-20%", "26rem") —
 * and returns it unchanged in LTR.
 */
export function mx(value: number): number
export function mx(value: string): string
export function mx(value: string | number): string | number {
  if (rtlSign() === 1) return value
  if (typeof value === "number") return -value
  const trimmed = value.trim()
  // Flip the sign textually rather than parsing: these are plain signed
  // lengths ("-38rem", "120%"), and re-serialising a parsed number would drop
  // the unit and quietly turn "26rem" into 26px.
  return trimmed.startsWith("-") ? trimmed.slice(1) : `-${trimmed}`
}
