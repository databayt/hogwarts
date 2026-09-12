"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { GenericCommandMenu } from "../"
import { saasSearchConfig } from "../saas-config"
import type { SearchContext } from "../types"

interface Props {
  context?: SearchContext
  iconClassName?: string
}

export default function SaasDashboardSpotlight({
  context,
  iconClassName,
}: Props) {
  return (
    <GenericCommandMenu
      config={saasSearchConfig}
      context={context}
      iconClassName={iconClassName}
    />
  )
}
