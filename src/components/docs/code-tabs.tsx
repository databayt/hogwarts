"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

import { Tabs } from "@/components/ui/tabs"

export function CodeTabs({ children }: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="cli" className="relative mt-6 w-full">
      {children}
    </Tabs>
  )
}
