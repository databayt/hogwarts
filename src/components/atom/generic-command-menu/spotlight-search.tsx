"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { SearchContext } from "./types"

type Surface =
  | "school-dashboard"
  | "saas-dashboard"
  | "saas-marketing"
  | "school-marketing"

/**
 * Lazy-load the surface chunk so each header (school dashboard, saas
 * dashboard, both marketing surfaces) only ships its own config + icons.
 * The school-dashboard route stops bundling the three unused configs.
 */
const Lazy = {
  "school-dashboard": React.lazy(() => import("./surfaces/school-dashboard")),
  "saas-dashboard": React.lazy(() => import("./surfaces/saas-dashboard")),
  "saas-marketing": React.lazy(() => import("./surfaces/saas-marketing")),
  "school-marketing": React.lazy(() => import("./surfaces/school-marketing")),
} as const

interface SpotlightSearchProps {
  surface: Surface
  context?: SearchContext
}

/**
 * Inert trigger shown while the lazy chunk is loading. Identical visual to
 * the real trigger inside `GenericCommandMenu` so there is no layout shift
 * — the chunk usually resolves on the first hover/Cmd+K and is cached.
 */
function SpotlightTriggerStub() {
  return (
    <Button
      variant="link"
      size="icon"
      className="size-7 cursor-pointer transition-opacity hover:opacity-70"
      disabled
      aria-hidden="true"
    >
      <Search className="h-4 w-4" />
    </Button>
  )
}

export function SpotlightSearch({ surface, context }: SpotlightSearchProps) {
  const Surface = Lazy[surface]
  return (
    <React.Suspense fallback={<SpotlightTriggerStub />}>
      <Surface context={context} />
    </React.Suspense>
  )
}
