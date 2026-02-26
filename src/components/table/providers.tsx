"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { TooltipProvider } from "@/components/ui/tooltip"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider delayDuration={120}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </TooltipProvider>
    </NextThemesProvider>
  )
}
