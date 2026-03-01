"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { GenericCommandMenu } from "."
import { platformSearchConfig } from "./platform-config"
import { saasSearchConfig } from "./saas-config"
import { saasMarketingSearchConfig } from "./saas-marketing-config"
import { schoolMarketingSearchConfig } from "./school-marketing-config"
import type { SearchConfig, SearchContext } from "./types"

type Surface =
  | "school-dashboard"
  | "saas-dashboard"
  | "saas-marketing"
  | "school-marketing"

const CONFIG_MAP: Record<Surface, SearchConfig> = {
  "school-dashboard": platformSearchConfig,
  "saas-dashboard": saasSearchConfig,
  "saas-marketing": saasMarketingSearchConfig,
  "school-marketing": schoolMarketingSearchConfig,
}

interface SpotlightSearchProps {
  surface: Surface
  context?: SearchContext
}

export function SpotlightSearch({ surface, context }: SpotlightSearchProps) {
  return <GenericCommandMenu config={CONFIG_MAP[surface]} context={context} />
}
