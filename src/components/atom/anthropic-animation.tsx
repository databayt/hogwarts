"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Anthropic Lottie art — the illustration set already used by the SaaS hero,
// the admissions hero and the library surface, packaged once so a new caller
// doesn't hand-roll a fourth fetch-and-render.
//
// Sibling to `celebration-animation.tsx` and built to the same discipline: one
// module-level cache per asset (one fetch per tab), lottie-web behind a
// deferred dynamic import, decorative so it's aria-hidden and honors
// prefers-reduced-motion, and a sized wrapper that always renders so the
// layout never shifts when the JSON lands.
//
// TWO differences from the confetti atom, both deliberate:
//
//  1. NO eager warm on module load. These files are ~1-2.6MB; the confetti is
//     small enough to prefetch for everyone, these are not. Callers that know
//     a success moment is coming call `prefetchAnthropicAnimation()` at the
//     step before it, and pay nothing on the paths that never get there.
//  2. Dark mode is a recolor, not a filter. The shipped art is Anthropic clay
//     (#d97757) over near-black linework — on a dark dialog that linework is
//     invisible. Lottie stores colors as 0..1 RGBA under `c.k`, so the fix is
//     a walk of the parsed JSON (the same technique the admissions hero uses
//     to remap clay → zenda purple). The clay accent is left alone: it is the
//     reason to reach for this art in the first place.
import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useReducedMotion } from "motion/react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

/** Assets published under the CDN's `anthropic/` namespace. */
export type AnthropicAnimationName = "api" | "hero" | "claude-for-excel"

function urlFor(name: AnthropicAnimationName): string {
  const cdn = process.env.NEXT_PUBLIC_CDN_DOMAIN || "cdn.databayt.org"
  return `https://${cdn}/anthropic/${name}.json`
}

// One entry per asset — a Map, not a single slot, so two names never evict
// each other on a page that shows both.
const cache = new Map<AnthropicAnimationName, object>()
const inflight = new Map<AnthropicAnimationName, Promise<object | null>>()

function load(name: AnthropicAnimationName): Promise<object | null> {
  const hit = cache.get(name)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(name)
  if (pending) return pending

  const request = fetch(urlFor(name))
    .then((res) => res.json())
    .then((data: object) => {
      cache.set(name, data)
      return data
    })
    .catch(() => null)
    .finally(() => inflight.delete(name))

  inflight.set(name, request)
  return request
}

/**
 * Start the download before the animation is on screen. Safe to call more than
 * once and safe to ignore — the render path loads the asset anyway; this only
 * decides whether the first frame is instant or a beat late.
 */
export function prefetchAnthropicAnimation(name: AnthropicAnimationName): void {
  if (typeof window === "undefined") return
  void load(name)
}

type RGB = [number, number, number]

// Measured off the shipped asset, not guessed: `api.json` contains exactly two
// solid colors — clay #d97757 (226 shapes) and near-black #131314 (199), which
// is the linework that disappears on a dark surface.
const INK: RGB = [0.075, 0.075, 0.078] // #131314
const INK_ON_DARK: RGB = [0.898, 0.886, 0.855] // warm off-white, not pure #fff

function near(value: number[], target: RGB): boolean {
  return (
    value.length >= 3 && target.every((v, i) => Math.abs(value[i] - v) < 0.06)
  )
}

/** Structural clone + recolor, so the cached original is never mutated. */
function withInkForDark(source: object): object {
  const copy = structuredClone(source) as object

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (!node || typeof node !== "object") return

    const obj = node as Record<string, unknown>
    const color = obj.c as { k?: unknown } | undefined
    if (color && Array.isArray(color.k)) {
      const channels = color.k as number[]
      if (channels.every((v) => typeof v === "number") && near(channels, INK)) {
        INK_ON_DARK.forEach((v, i) => (channels[i] = v))
      }
    }
    Object.values(obj).forEach(walk)
  }

  walk(copy)
  return copy
}

interface AnthropicAnimationProps {
  name: AnthropicAnimationName
  /** Sizing/spacing for the wrapper. Defaults to a centered 32×32 (h-32 w-32). */
  className?: string
  /** Defaults to looping; pass false for a play-once success beat. */
  loop?: boolean
}

export function AnthropicAnimation({
  name,
  className,
  loop = true,
}: AnthropicAnimationProps) {
  const reduce = useReducedMotion()
  const { resolvedTheme } = useTheme()
  // Seed from the cache so a prefetched asset paints on the first render.
  const [raw, setRaw] = useState<object | null>(() => cache.get(name) ?? null)

  useEffect(() => {
    let cancelled = false
    setRaw(cache.get(name) ?? null)
    void load(name).then((data) => {
      if (!cancelled && data) setRaw(data)
    })
    return () => {
      cancelled = true
    }
  }, [name])

  const animationData = useMemo(() => {
    if (!raw) return null
    return resolvedTheme === "dark" ? withInkForDark(raw) : raw
  }, [raw, resolvedTheme])

  return (
    <div className={cn("mx-auto h-32 w-32", className)} aria-hidden="true">
      {animationData && (
        <Lottie
          animationData={animationData}
          loop={!reduce && loop}
          autoplay={!reduce}
        />
      )}
    </div>
  )
}
