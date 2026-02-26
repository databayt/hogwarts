// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Card from "@/components/atom/card"
import type { Locale } from "@/components/internationalization/config"

import { FEATURES } from "./constants"
import { getCategoryIcon } from "./feature-icons"
import type { FeatureCategory } from "./types"

type TabId = "all" | "core" | "advanced" | FeatureCategory

interface FeatureTabsProps {
  lang: Locale
}

const INITIAL_ROWS = 3
const COLS_LG = 4
const INITIAL_COUNT = INITIAL_ROWS * COLS_LG

const CORE_CATEGORIES: FeatureCategory[] = [
  "core",
  "academic",
  "scheduling",
  "finance",
]

const tabs: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "core", label: "Core" },
  { id: "advanced", label: "Advanced" },
  { id: "academic", label: "Academic" },
  { id: "scheduling", label: "Scheduling" },
  { id: "finance", label: "Finance" },
  { id: "communication", label: "Communication" },
  { id: "e-learning", label: "E-Learning" },
]

export default function FeatureTabs({ lang }: FeatureTabsProps) {
  const [active, setActive] = useState<TabId>("all")
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(
    () =>
      active === "all"
        ? FEATURES
        : active === "core"
          ? FEATURES.filter((f) => CORE_CATEGORIES.includes(f.category))
          : active === "advanced"
            ? FEATURES.filter((f) => !CORE_CATEGORIES.includes(f.category))
            : FEATURES.filter((f) => f.category === active),
    [active]
  )

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT)
  const hasMore = filtered.length > INITIAL_COUNT

  return (
    <>
      {/* Tabs */}
      <div className="border-b-[0.5px] py-3">
        <div className="relative">
          <ScrollArea className="max-w-[600px] lg:max-w-none">
            <nav className="flex items-center gap-2 rtl:flex-row-reverse">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
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
        {visible.map((feature) => {
          const Icon = getCategoryIcon(feature.category)
          return (
            <Card
              key={feature.id}
              id={feature.id}
              title={feature.title}
              description={feature.description}
              icon={<Icon />}
              href={`/${lang}/features/${feature.id}`}
            />
          )
        })}
      </div>

      {/* See more */}
      {hasMore && !expanded && (
        <div className="flex justify-center pb-8">
          <button
            onClick={() => setExpanded(true)}
            className="text-muted-foreground hover:text-foreground underline-offset-4 transition-colors hover:underline"
          >
            See more
          </button>
        </div>
      )}
    </>
  )
}
