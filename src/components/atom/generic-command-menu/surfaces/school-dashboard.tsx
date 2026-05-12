"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

import { useDictionary } from "@/components/internationalization/use-dictionary"
import { platformNav } from "@/components/template/platform-sidebar/config"

import { GenericCommandMenu } from "../"
import { deriveNavSearchItems } from "../derive-from-platform-nav"
import { platformSearchConfig } from "../platform-config"
import type { SearchConfig, SearchContext } from "../types"

interface Props {
  context?: SearchContext
}

/**
 * Lazy chunk for the school-dashboard spotlight surface.
 *
 * Derives the static `navigation` group from `platformNav` (the sidebar
 * source of truth) so the two registries stay in sync. Quick `actions` come
 * from the existing hand-curated `platformSearchConfig`.
 */
export default function SchoolDashboardSpotlight({ context }: Props) {
  const { dictionary } = useDictionary()
  const sidebarDict = dictionary?.platform?.sidebar as
    | Record<string, string>
    | undefined
  const breadcrumbDict = dictionary?.platform?.breadcrumb as
    | Record<string, string>
    | undefined

  const config = React.useMemo<SearchConfig>(
    () => ({
      ...platformSearchConfig,
      navigation: deriveNavSearchItems({
        navItems: platformNav,
        sidebarDict,
        breadcrumbDict,
      }),
    }),
    [sidebarDict, breadcrumbDict]
  )

  return <GenericCommandMenu config={config} context={context} />
}
