"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { useOpenOnHero } from "@/components/lumos/shared/title-card/use-open-on-hero"

// The header's own phone breakpoint — `MobileNav` is `lg:hidden`. Kept in step
// with the `max-lg:` variant the marketing layout reads the marker with.
const PHONE = "(width < 64rem)"

/**
 * A marketing page's hero, opened the way the lumos lesson opens on a phone.
 *
 * `data-immersive` is read by the `(saas-marketing)` layout, which unpins
 * `SiteHeader` below `lg` for the page's whole length. `useOpenOnHero` — the
 * one hook the lesson and the live room share — then lands the page on this
 * wrapper's top edge, so the hero is the first thing on screen and the header
 * is one short scroll up.
 *
 * On the hero rather than the page root: pricing and features/[id] pad their
 * roots, and measuring the root would leave that padding on screen instead
 * of the hero's edge. A hero with no top padding of its own takes
 * `-mt-8 pt-8` from the root's, so it lands with the same 32px of air as the
 * `PageHeader` heroes without moving on desktop. Desktop keeps the sticky bar
 * and never scrolls.
 */
export function ImmersiveHero({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(PHONE)
    setIsPhone(mql.matches)
    const onChange = () => setIsPhone(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  useOpenOnHero(ref, isPhone, pathname)

  return (
    <div ref={ref} data-immersive className={cn(className)}>
      {children}
    </div>
  )
}
