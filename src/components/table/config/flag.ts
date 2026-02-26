// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { CommandIcon, FileSpreadsheetIcon } from "lucide-react"

export type FlagConfig = typeof flagConfig

export const flagConfig = {
  featureFlags: [
    {
      label: "Advanced filters",
      value: "advancedFilters" as const,
      icon: FileSpreadsheetIcon,
      tooltipTitle: "Advanced filters",
      tooltipDescription: "Airtable like advanced filters for filtering rows.",
    },
    {
      label: "Command filters",
      value: "commandFilters" as const,
      icon: CommandIcon,
      tooltipTitle: "Command filter chips",
      tooltipDescription: "Linear like command palette for filtering rows.",
    },
  ],
}
