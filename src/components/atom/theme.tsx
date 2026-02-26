"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      enableSystem={true}
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
