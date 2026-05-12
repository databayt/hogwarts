"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { GenericCommandMenu } from "../"
import { schoolMarketingSearchConfig } from "../school-marketing-config"
import type { SearchContext } from "../types"

interface Props {
  context?: SearchContext
}

export default function SchoolMarketingSpotlight({ context }: Props) {
  return (
    <GenericCommandMenu
      config={schoolMarketingSearchConfig}
      context={context}
    />
  )
}
