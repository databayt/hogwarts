// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cache } from "react"
import { cookies, headers } from "next/headers"

import type { Lang } from "./types"

/**
 * The viewer's preferred display language, resolved AMBIENTLY so callers stop
 * prop-drilling `lang` everywhere: `x-locale` header (set by middleware in
 * `src/proxy.ts`) → `NEXT_LOCALE` cookie → "ar".
 *
 * `cache()`-wrapped so the `headers()`/`cookies()` read happens once per request
 * no matter how many `localize()` calls ask for it. Self-contained in the
 * translation module on purpose — it does not depend on (and is not reverted
 * with) `tenant-context.ts`.
 */
export const getDisplayLang = cache(
  async function getDisplayLang(): Promise<Lang> {
    try {
      const h = await headers()
      const fromHeader = h.get("x-locale")
      if (fromHeader === "en" || fromHeader === "ar") return fromHeader
      const c = await cookies()
      return c.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar"
    } catch {
      return "ar"
    }
  }
)
