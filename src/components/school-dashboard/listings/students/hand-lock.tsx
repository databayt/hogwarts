"use client"

// Hero pictogram for the credentials dialog. Plays the Hand-Lock dotLottie
// (extracted from Claude's "Stay in control" pictogram) and recolors the
// rendered SVG every other animation frame so the artwork inherits the
// shadcn theme (light/dark) instead of shipping hardcoded source colors.
//
// Source colors in /public/animations/hand-lock.json:
//   [0.0784, 0.0784, 0.0745, 1] → #141413  (the lock + hand)        → currentColor
//   [0.8902, 0.8549, 0.8000, 1] → #E3DACC  (highlights / accent)    → var(--muted)
// Re-walking on every animation frame mirrors the same approach the original
// embed uses, since lottie-web rewrites SVG fill attributes per frame and a
// one-shot recolor is overwritten by the next paint.
import { useEffect, useRef, useState } from "react"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { useReducedMotion } from "motion/react"

const COLOR_MAP: Record<string, string> = {
  "#141413": "currentColor",
  "rgb(20,20,19)": "currentColor",
  "rgb(20, 20, 19)": "currentColor",
  "#e3dacc": "var(--muted)",
  "rgb(227,218,204)": "var(--muted)",
  "rgb(227, 218, 204)": "var(--muted)",
}

function normalize(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed || trimmed === "none") return null
  return trimmed
}

function recolorSvg(svg: SVGElement) {
  const targets = svg.querySelectorAll<SVGElement>(
    "path, rect, circle, ellipse, polygon, polyline, g, use, stop"
  )
  targets.forEach((el) => {
    const fillSrc = normalize(el.getAttribute("fill") ?? el.style.fill)
    if (fillSrc && COLOR_MAP[fillSrc]) {
      const next = COLOR_MAP[fillSrc]
      el.setAttribute("fill", next)
      el.style.fill = next
    }
    const strokeSrc = normalize(el.getAttribute("stroke") ?? el.style.stroke)
    if (strokeSrc && COLOR_MAP[strokeSrc]) {
      const next = COLOR_MAP[strokeSrc]
      el.setAttribute("stroke", next)
      el.style.stroke = next
    }
  })
}

interface HandLockProps {
  className?: string
}

export function HandLock({ className }: HandLockProps) {
  const reduce = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<object | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/animations/hand-lock.json")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data)
      })
      .catch(() => {
        // Silent failure — the dialog body still works without the hero.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!animationData) return
    const node = containerRef.current
    if (!node) return

    let frame = 0
    let raf = requestAnimationFrame(function tick() {
      // Every other frame keeps theming in step with lottie-web repaints
      // without doubling the per-frame DOM walk cost.
      if (frame++ % 2 === 0) {
        const svg = node.querySelector("svg")
        if (svg) recolorSvg(svg as SVGElement)
      }
      raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [animationData])

  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      {animationData && (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop
          autoplay={!reduce}
        />
      )}
    </div>
  )
}
