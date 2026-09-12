"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { GenericCommandMenu } from "../"
import { saasMarketingSearchConfig } from "../saas-marketing-config"
import type { SearchContext } from "../types"

interface Props {
  context?: SearchContext
  iconClassName?: string
}

export default function SaasMarketingSpotlight({
  context,
  iconClassName,
}: Props) {
  return (
    <GenericCommandMenu
      config={saasMarketingSearchConfig}
      context={context}
      iconClassName={iconClassName}
    />
  )
}
