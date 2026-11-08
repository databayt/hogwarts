// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Card from "@/components/atom/card"
import { SeeMore } from "@/components/atom/see-more"

/**
 * One card, already localized and with its icon rendered on the server.
 * The shell only keeps which tab is open, so the features catalog
 * (`constants.tsx`, the Arabic copy in `i18n.ts`, the icon table) never
 * reaches the browser bundle.
 */
export interface FeatureTabItem {
  id: string
  title: string
  description: string
  /** Tab-group id from `FEATURE_GROUPS`; ungrouped cards show under "all". */
  group?: string
  href: string
  icon: ReactNode
}

export interface FeatureTabOption {
  id: string
  label: string
}

interface FeatureTabsProps {
  items: FeatureTabItem[]
  /** Includes the synthetic "all" tab first. */
  tabs: FeatureTabOption[]
  seeMoreLabel: string
  dir: "rtl" | "ltr"
}

const INITIAL_ROWS = 3
const COLS_LG = 4
const INITIAL_COUNT = INITIAL_ROWS * COLS_LG

export default function FeatureTabs({
  items,
  tabs,
  seeMoreLabel,
  dir,
}: FeatureTabsProps) {
  const [active, setActive] = useState("all")
  const [expanded, setExpanded] = useState(false)

  const filtered =
    active === "all" ? items : items.filter((item) => item.group === active)
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT)
  const hasMore = filtered.length > INITIAL_COUNT

  return (
    <>
      {/* Tabs */}
      <div className="border-b-[0.5px] py-3">
        <div className="relative">
          <ScrollArea className="max-w-[600px] lg:max-w-none" dir={dir}>
            <nav className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active === tab.id}
                  onClick={() => {
                    setActive(tab.id)
                    setExpanded(false)
                  }}
                  className={cn(
                    "hover:text-primary flex h-7 shrink-0 items-center justify-center rounded-full px-3 text-center text-sm transition-colors",
                    active === tab.id ? "bg-muted text-primary" : ""
                  )}
                >
                  <h6>{tab.label}</h6>
                </button>
              ))}
            </nav>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((item) => (
          <Card
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </div>

      {/* See more */}
      <SeeMore
        hasMore={hasMore && !expanded}
        onClick={() => setExpanded(true)}
        label={seeMoreLabel}
        className="pb-8"
      />
    </>
  )
}
