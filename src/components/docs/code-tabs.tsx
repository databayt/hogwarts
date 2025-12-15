"use client"

import * as React from "react"

import { Tabs } from "@/components/ui/tabs"

export function CodeTabs({ children }: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="cli" className="relative mt-6 w-full">
      {children}
    </Tabs>
  )
}
