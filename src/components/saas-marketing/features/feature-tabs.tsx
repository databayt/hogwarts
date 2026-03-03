// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Card from "@/components/atom/card"
import { SeeMore } from "@/components/atom/see-more"
import type { Locale } from "@/components/internationalization/config"

import { FEATURES } from "./constants"
import { getCategoryIcon } from "./feature-icons"
import type { FeatureCategory } from "./types"

type TabId = "all" | FeatureCategory

interface FeatureTabsProps {
  lang: Locale
}

const INITIAL_ROWS = 3
const COLS_LG = 4
const INITIAL_COUNT = INITIAL_ROWS * COLS_LG

const tabs: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "core", label: "Core" },
  { id: "essential", label: "Essential" },
  { id: "advance", label: "Advance" },
  { id: "erp", label: "ERP" },
  { id: "management", label: "Management" },
  { id: "communication", label: "Communication" },
  { id: "lms", label: "LMS" },
  { id: "technical", label: "Technical" },
  { id: "integration", label: "Integration" },
  { id: "ai", label: "AI" },
]

export default function FeatureTabs({ lang }: FeatureTabsProps) {
  const [active, setActive] = useState<TabId>("all")
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(
    () =>
      active === "all"
        ? FEATURES
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
      <SeeMore
        hasMore={hasMore && !expanded}
        onClick={() => setExpanded(true)}
        label="See more"
        className="pb-8"
      />
    </>
  )
}
