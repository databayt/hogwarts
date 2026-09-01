"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { CHATBOT_POSITIONS } from "./constant"
import type { ChatButtonProps } from "./type"

// The filled robot mark, shared with the marketing site. Published under its
// own CDN key rather than overwriting `robot.png` — that object is served
// `immutable`, so returning visitors would keep the old outline art for a year.
const DEFAULT_AVATAR = asset("/illustrations/robot-fill.png")

/**
 * The alpha and the perceived lightness of a computed `background-color`.
 *
 * `getComputedStyle` does not normalise to `rgb()` any more: Tailwind v4's
 * tokens are authored in OKLCH and Chrome serialises those back verbatim, so
 * a naive rgb-only parser reads every themed surface as `null` and the mark
 * never flips on the dashboards. Both notations are handled, plus the
 * `color()` function; anything else is treated as unreadable.
 */
function readColor(color: string): { alpha: number; lightness: number } | null {
  const c = color.trim().toLowerCase()
  if (c === "transparent") return { alpha: 0, lightness: 1 }

  // Drop the function name and any colour-space keyword before reading the
  // numbers — `color(display-p3 …)` would otherwise contribute a stray "3".
  const args = c.replace(/^[a-z-]+\(/, "").replace(/^[a-z][a-z0-9-]*\s+/, "")
  const parts = args.match(/-?[\d.]+%?/g)
  if (!parts || parts.length < 3) return null

  const pct = (raw: string) => raw.endsWith("%")
  const val = (raw: string) => Number(pct(raw) ? raw.slice(0, -1) : raw)
  const alpha = parts.length > 3 ? val(parts[3]) / (pct(parts[3]) ? 100 : 1) : 1

  // OKLCH / OKLab / LCH / Lab carry perceptual lightness in the first slot:
  // 0..1 for the OK variants, 0..100 for the CIE ones, or a percentage.
  if (/^(oklch|oklab|lch|lab)\(/.test(c)) {
    const raw = parts[0]
    const l = pct(raw) || !c.startsWith("ok") ? val(raw) / 100 : val(raw)
    return { alpha, lightness: l }
  }

  // rgb() / rgba() are 0..255; color(<space> r g b) is 0..1.
  const scale = c.startsWith("color(") ? 1 : 255
  const [r, g, b] = [0, 1, 2].map((i) =>
    pct(parts[i]) ? val(parts[i]) / 100 : val(parts[i]) / scale
  )
  return { alpha, lightness: 0.2126 * r + 0.7152 * g + 0.0722 * b }
}

export function ChatButton({
  onClick,
  isOpen,
  position = "bottom-right",
  dictionary,
  schoolLogoUrl,
  schoolName,
}: ChatButtonProps) {
  const [shouldInvert, setShouldInvert] = useState(false)
  const pathname = usePathname()
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rafRef = useRef<number | null>(null)

  // School-branded FAB when a logo is provided; otherwise fall back to the
  // generic robot illustration. The dark-section invert hack is skipped for
  // school logos because tenant logos are arbitrary and inverting a brand
  // mark looks broken.
  const usingSchoolLogo = Boolean(schoolLogoUrl)
  const avatarSrc = schoolLogoUrl ?? DEFAULT_AVATAR
  const avatarAlt = usingSchoolLogo
    ? (schoolName ?? dictionary.openChat)
    : "Chatbot"

  useEffect(() => {
    if (usingSchoolLogo) return

    // Sample the colour actually painted behind the button rather than
    // matching a list of "dark section" selectors — that list rotted (none of
    // the markers it named exist in the DOM any more, so the flip had been
    // silently dead) and it could only ever know about the surfaces someone
    // remembered to tag. Reading the composited background instead keeps the
    // mark black on light ground and white on dark ground everywhere: the
    // marketing clone's hardcoded #000 sections, the school sites, and any
    // dark-theme dashboard alike.
    const checkSections = () => {
      const button = document.querySelector("[data-chat-button]")
      if (!button) return

      const rect = button.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      // Paint order, topmost first — the button and its own subtree are
      // transparent by design, so they are skipped and the walk continues
      // into whatever the FAB is sitting on top of.
      const stack = document.elementsFromPoint(x, y)
      let backdrop: number | null = null

      for (const el of stack) {
        if (el === button || button.contains(el)) continue
        // Anything translucent (the clone ships rgba(0,0,0,.05) overlays) is
        // not what the eye reads as the ground — keep walking to the first
        // essentially-opaque layer.
        const read = readColor(window.getComputedStyle(el).backgroundColor)
        if (read && read.alpha >= 0.9) {
          backdrop = read.lightness
          break
        }
      }

      if (backdrop === null) {
        // Nothing opaque under the button (a section painted only by an image
        // or gradient). Fall back to the theme so the mark still contrasts.
        setShouldInvert(document.documentElement.classList.contains("dark"))
        return
      }

      setShouldInvert(backdrop < 0.5)
    }

    const debouncedCheck = () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      checkTimeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(checkSections)
      }, 100)
    }

    checkSections()
    // A second pass once the first paint has settled — on a cold load (and on
    // the frame right after a soft navigation) the section under the FAB may
    // not have laid out yet, and nothing would fire a scroll or resize to
    // correct a mark sampled against the wrong ground.
    const settle = setTimeout(checkSections, 400)

    window.addEventListener("scroll", debouncedCheck, { passive: true })
    window.addEventListener("resize", debouncedCheck)

    return () => {
      clearTimeout(settle)
      window.removeEventListener("scroll", debouncedCheck)
      window.removeEventListener("resize", debouncedCheck)
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
    // `pathname` re-runs the check on soft navigation: the FAB is mounted by
    // the layout, so the page under it swaps with no scroll or resize event
    // and the sampled result would otherwise go stale.
  }, [usingSchoolLogo, pathname])

  return (
    <>
      {!isOpen && (
        <Button
          onClick={onClick}
          data-chat-button
          className={cn(
            CHATBOT_POSITIONS[position],
            "z-[9999] hidden transition-all duration-700 ease-in-out md:block",
            "h-12 w-12 rounded-full p-2 md:h-14 md:w-14",
            "border-none bg-transparent shadow-none hover:bg-transparent",
            "hover:scale-105",
            // School logos render full-bleed inside a circle; robot stays as-is
            usingSchoolLogo && "overflow-hidden"
          )}
          aria-label={dictionary.openChat}
          size="icon"
          variant="ghost"
        >
          <Image
            src={avatarSrc}
            alt={avatarAlt}
            width={56}
            height={56}
            className={cn(
              "h-full w-full transition-all duration-500",
              usingSchoolLogo ? "rounded-full object-cover" : "object-contain",
              !usingSchoolLogo && shouldInvert && "invert"
            )}
            unoptimized={
              // School logos may be external URLs that aren't in next.config
              // image domains; skip optimization to avoid runtime 502s.
              usingSchoolLogo
            }
          />
        </Button>
      )}
    </>
  )
}
