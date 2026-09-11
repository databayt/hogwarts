"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Link from "next/link"

import { tenantOriginFromLocation } from "@/lib/root-domain"

interface DemoLinkProps {
  /** Server-computed fallback (primary root) used for SSR and as override */
  fallbackHref: string
  lang: string
  /** Path appended after the locale, e.g. "/dashboard". Defaults to none. */
  path?: string
  /** Open in a new tab. Marketing CTAs do; the header's sign-in does not. */
  newTab?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * "Live Demo" link that follows the visitor's root domain: on balqalam.com it
 * points at demo.balqalam.com, on ed.databayt.org at demo.databayt.org. The
 * server-rendered href is the primary-root fallback and re-resolves after
 * mount; an explicit NEXT_PUBLIC_DEMO_URL stays authoritative.
 */
export function DemoLink({
  fallbackHref,
  lang,
  path = "",
  newTab = true,
  className,
  children,
}: DemoLinkProps) {
  const [href, setHref] = useState(fallbackHref)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_URL) return
    setHref(`${tenantOriginFromLocation("demo")}/${lang}${path}`)
  }, [lang, path])

  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className={className}
    >
      {children}
    </Link>
  )
}
