"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

/**
 * The subject layout wraps every sub-route with the catalog hero. The reader
 * wants a focused page, and a layout cannot see the pathname, so this gate
 * drops the hero on `…/textbook` only.
 */
export function HeroGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname?.replace(/\/$/, "").endsWith("/textbook")) return null
  return <>{children}</>
}
