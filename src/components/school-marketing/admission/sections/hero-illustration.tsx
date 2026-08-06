"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Lottie from "lottie-react"

// Same animation as Claude API page — served from the unified asset CDN
const ANIMATION_URL = `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN || "cdn.databayt.org"}/anthropic/api.json`

// The shipped animation is painted in Anthropic clay (#d97757) over near-black.
// The admissions page rides the zenda chrome, so the accent is remapped to
// zenda's --primary--purple (#ac6cf4); the linework keeps the asset's own
// near-black, which reads as the black-and-purple pairing zenda.com uses (it
// was briefly --secondary--dark-purple, which made the whole illustration
// monochrome purple). Lottie stores colors as 0..1 RGBA under `c.k`, so this is
// a walk of the parsed JSON rather than a second asset on the CDN.
const CLAY: RGB = [0.851, 0.467, 0.341] // #d97757
const ZENDA_PURPLE: RGB = [0.674, 0.424, 0.957] // #ac6cf4

type RGB = [number, number, number]

function near(a: number[], b: RGB) {
  return a.length >= 3 && b.every((v, i) => Math.abs(a[i] - v) < 0.02)
}

function recolor(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(recolor)
    return
  }
  if (!node || typeof node !== "object") return

  const obj = node as Record<string, unknown>
  const color = obj.c as { k?: unknown } | undefined
  if (color && Array.isArray(color.k)) {
    const k = color.k as number[]
    if (k.every((v) => typeof v === "number")) {
      if (near(k, CLAY)) ZENDA_PURPLE.forEach((v, i) => (k[i] = v))
    }
  }

  Object.values(obj).forEach(recolor)
}

export function AdmissionHeroIllustration() {
  const [animationData, setAnimationData] = useState<unknown>(null)

  useEffect(() => {
    fetch(ANIMATION_URL)
      .then((res) => res.json())
      .then((data) => {
        recolor(data)
        setAnimationData(data)
      })
      .catch(console.error)
  }, [])

  if (!animationData) {
    return (
      <div className="relative h-[300px] w-[300px] sm:h-[350px] sm:w-[350px] lg:h-[450px] lg:w-[450px]">
        <div className="h-full w-full animate-pulse rounded-full bg-[#ac6cf4]/15" />
      </div>
    )
  }

  return (
    <div className="relative h-[300px] w-[300px] sm:h-[350px] sm:w-[350px] lg:h-[450px] lg:w-[450px]">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  )
}

export default AdmissionHeroIllustration
