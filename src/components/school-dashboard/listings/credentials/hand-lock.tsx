"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Hero pictogram for the credentials dialog — the Hand-Lock dotLottie
// (Claude's "Stay in control" pictogram), themed to light/dark.
//
// Anti-flash design (three distinct causes, all addressed here):
//  1. Re-fetch on every open. Radix unmounts the dialog body on close, so this
//     component remounts each open. We cache the JSON at MODULE level (fetched
//     once per tab) and warm it on import, so reopening is instant — no
//     blank → pop-in.
//  2. Live recolor racing lottie's repaint. We don't touch the rendered SVG at
//     all; the theme colors are BAKED into the animation JSON once, so every
//     frame lottie paints is already themed.
//  3. Dark-mode re-bake restart. `isDark` is seeded from the real DOM on first
//     render (not false-then-effect), so the baked data is correct immediately
//     and lottie never restarts with swapped colors.
import { useEffect, useMemo, useState } from "react"
import Lottie from "lottie-react"
import { useReducedMotion } from "motion/react"

const ANIMATION_URL = `https://${
  process.env.NEXT_PUBLIC_CDN_DOMAIN || "cdn.databayt.org"
}/hogwarts/animations/hand-lock.json`

// Module-level cache — one fetch per tab, shared across every dialog open.
let cachedRaw: object | null = null
let inflight: Promise<object | null> | null = null

function loadHandLock(): Promise<object | null> {
  if (cachedRaw) return Promise.resolve(cachedRaw)
  if (inflight) return inflight
  inflight = fetch(ANIMATION_URL)
    .then((res) => res.json())
    .then((data) => {
      cachedRaw = data
      return data as object
    })
    .catch(() => null)
  return inflight
}

// Warm the cache as soon as this module loads on the client (table render), so
// the very first dialog open is already instant.
if (typeof window !== "undefined") void loadHandLock()

// Source colors baked into hand-lock.json (0–1 floats):
//   #141413 → the hand + lock body   (themed to foreground)
//   #E3DACC → highlights / accent     (themed to a muted tone)
const SRC_BODY = [0.0784, 0.0784, 0.0745]
const SRC_ACCENT = [0.8902, 0.8549, 0.8]

function near(c: number[], s: number[], tol = 0.04): boolean {
  return (
    Math.abs(c[0] - s[0]) < tol &&
    Math.abs(c[1] - s[1]) < tol &&
    Math.abs(c[2] - s[2]) < tol
  )
}

// A lottie color is a 3- or 4-number array (rgb / rgba, alpha≈1). Matching on
// the two SPECIFIC source colors avoids touching position/bezier arrays.
function isColorArray(n: unknown): n is number[] {
  if (!Array.isArray(n)) return false
  if (n.length !== 3 && n.length !== 4) return false
  if (typeof n[0] !== "number" || typeof n[1] !== "number") return false
  if (typeof n[2] !== "number") return false
  if (n.length === 4 && Math.abs((n[3] as number) - 1) > 0.02) return false
  return true
}

function bake(node: unknown, body: number[], accent: number[]): void {
  if (Array.isArray(node)) {
    if (isColorArray(node)) {
      if (near(node, SRC_BODY)) {
        node[0] = body[0]
        node[1] = body[1]
        node[2] = body[2]
        return
      }
      if (near(node, SRC_ACCENT)) {
        node[0] = accent[0]
        node[1] = accent[1]
        node[2] = accent[2]
        return
      }
    }
    for (const item of node) bake(item, body, accent)
  } else if (node && typeof node === "object") {
    for (const key in node as Record<string, unknown>) {
      bake((node as Record<string, unknown>)[key], body, accent)
    }
  }
}

function themed(raw: object, isDark: boolean): object {
  // Readable on both themes; mirrors the dark-body / soft-accent original.
  const body = isDark ? [0.92, 0.92, 0.92] : [0.09, 0.09, 0.09]
  const accent = isDark ? [0.34, 0.34, 0.34] : [0.8, 0.8, 0.8]
  const clone = structuredClone(raw)
  bake(clone, body, accent)
  return clone
}

function readIsDark(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  )
}

interface HandLockProps {
  className?: string
}

export function HandLock({ className }: HandLockProps) {
  const reduce = useReducedMotion()
  // Seed from cache + real theme on first render → no blank frame, no recolor
  // flip when the dialog (re)opens.
  const [raw, setRaw] = useState<object | null>(() => cachedRaw)
  const [isDark, setIsDark] = useState(readIsDark)

  useEffect(() => {
    if (raw) return
    let cancelled = false
    loadHandLock().then((data) => {
      if (!cancelled && data) setRaw(data)
    })
    return () => {
      cancelled = true
    }
  }, [raw])

  useEffect(() => {
    if (typeof document === "undefined") return
    const obs = new MutationObserver(() => setIsDark(readIsDark()))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => obs.disconnect()
  }, [])

  const data = useMemo(() => (raw ? themed(raw, isDark) : null), [raw, isDark])

  return (
    <div className={className} aria-hidden="true">
      {data && <Lottie animationData={data} loop autoplay={!reduce} />}
    </div>
  )
}
