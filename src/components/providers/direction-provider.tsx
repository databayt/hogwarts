"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { Direction as DirectionPrimitive } from "radix-ui"

interface DirectionProviderProps {
  direction: "ltr" | "rtl"
  lang: string
  children: React.ReactNode
}

export function DirectionProvider({
  direction,
  lang,
  children,
}: DirectionProviderProps) {
  React.useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = direction
  }, [direction, lang])

  return (
    <DirectionPrimitive.Provider dir={direction}>
      {children}
    </DirectionPrimitive.Provider>
  )
}
