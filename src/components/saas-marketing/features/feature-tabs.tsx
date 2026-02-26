// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Card from "@/components/atom/card"
import type { Locale } from "@/components/internationalization/config"

import { CATEGORIES, FEATURES } from "./constants"
import { getIconComponent } from "./icon-map"
import type { FeatureCategory } from "./types"

interface FeatureTabsProps {
  lang: Locale
}

export default function FeatureTabs({ lang }: FeatureTabsProps) {
  const [active, setActive] = useState<FeatureCategory | "all">("all")

  const filtered = useMemo(
    () =>
      active === "all"
        ? FEATURES
        : FEATURES.filter((f) => f.category === active),
    [active]
  )

  const tabs: { id: FeatureCategory | "all"; label: string }[] = [
    { id: "all", label: "All" },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ]

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
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "hover:text-primary flex h-7 shrink-0 items-center justify-center rounded-full px-4 text-center transition-colors",
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
        {filtered.map((feature) => {
          const Icon = getIconComponent(feature.icon)
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
    </>
  )
}
