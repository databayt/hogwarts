"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Exact Hand-Blocks pictogram from https://claude.com/resources/use-cases
// Rendered via lottie-react with theme baking (light: dark linework + terracotta accent,
// dark: warm light linework + terracotta accent).
import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

const ANIMATION_URL = "/lottie/hand-blocks.json"

let cachedRaw: object | null = null
let inflight: Promise<object | null> | null = null

function loadHandBlocks(): Promise<object | null> {
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

if (typeof window !== "undefined") void loadHandBlocks()

// Source colors in hand-blocks.json (RGB 0..1):
//   #141413 [0.0784, 0.0784, 0.0745] -> hand + block linework
//   #E3DACC [0.8902, 0.8549, 0.8]    -> highlight / accent (terracotta #d97757)
const SRC_LINEWORK = [0.0784, 0.0784, 0.0745]
const SRC_ACCENT = [0.8902, 0.8549, 0.8]

// Terracotta clay accent from Anthropic design system: #d97757 -> [0.851, 0.467, 0.341]
const TERRACOTTA_ACCENT = [0.851, 0.467, 0.341]

function near(c: number[], s: number[], tol = 0.05): boolean {
  return (
    Math.abs(c[0] - s[0]) < tol &&
    Math.abs(c[1] - s[1]) < tol &&
    Math.abs(c[2] - s[2]) < tol
  )
}

function isColorArray(n: unknown): n is number[] {
  if (!Array.isArray(n)) return false
  if (n.length !== 3 && n.length !== 4) return false
  if (typeof n[0] !== "number" || typeof n[1] !== "number") return false
  if (typeof n[2] !== "number") return false
  if (n.length === 4 && Math.abs((n[3] as number) - 1) > 0.02) return false
  return true
}

function bake(node: unknown, linework: number[], accent: number[]): void {
  if (Array.isArray(node)) {
    if (isColorArray(node)) {
      if (near(node, SRC_LINEWORK)) {
        node[0] = linework[0]
        node[1] = linework[1]
        node[2] = linework[2]
        return
      }
      if (near(node, SRC_ACCENT)) {
        node[0] = accent[0]
        node[1] = accent[1]
        node[2] = accent[2]
        return
      }
    }
    for (const item of node) bake(item, linework, accent)
  } else if (node && typeof node === "object") {
    for (const key in node as Record<string, unknown>) {
      bake((node as Record<string, unknown>)[key], linework, accent)
    }
  }
}

function themed(raw: object, isDark: boolean): object {
  const linework = isDark ? [0.92, 0.92, 0.92] : [0.08, 0.08, 0.08]
  const accent = TERRACOTTA_ACCENT
  const clone = structuredClone(raw)
  bake(clone, linework, accent)
  return clone
}

function readIsDark(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  )
}

interface VideoUploadSuccessArtProps {
  className?: string
  loop?: boolean
}

export function VideoUploadSuccessArt({
  className,
  loop = true,
}: VideoUploadSuccessArtProps) {
  const reduce = useReducedMotion()
  const [raw, setRaw] = useState<object | null>(() => cachedRaw)
  const [isDark, setIsDark] = useState(readIsDark)

  useEffect(() => {
    if (raw) return
    let cancelled = false
    loadHandBlocks().then((data) => {
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
    <div
      className={cn("flex size-24 items-center justify-center", className)}
      aria-hidden="true"
    >
      {data && (
        <Lottie
          animationData={data}
          loop={!reduce && loop}
          autoplay={!reduce}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  )
}
