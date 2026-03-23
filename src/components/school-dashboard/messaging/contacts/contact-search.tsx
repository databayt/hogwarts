"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { ContactCategory } from "./types"

export interface ContactSearchProps {
  search: string
  onSearchChange: (value: string) => void
  activeFilter: ContactCategory | "all"
  onFilterChange: (filter: ContactCategory | "all") => void
  filterChips: { key: ContactCategory | "all"; label: string }[]
  locale?: "ar" | "en"
}

export function ContactSearch({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filterChips,
  locale = "en",
}: ContactSearchProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging

  return (
    <div className="space-y-2 px-3 pt-2">
      {/* Search input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            m?.contacts?.search_placeholder ??
            (locale === "ar" ? "بحث في جهات الاتصال..." : "Search contacts...")
          }
          className={cn(
            "bg-msg-search-bg text-msg-search-text placeholder:text-msg-search-placeholder w-full rounded-[21px] py-1.5 ps-9 pe-3 text-sm",
            "focus:ring-msg-search-focus focus:ring-1 focus:outline-none"
          )}
        />
      </div>

      {/* Filter chips */}
      <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.key
          const label =
            chip.key === "all"
              ? (m?.contacts?.filter_all ?? (locale === "ar" ? "الكل" : "All"))
              : ((
                  m?.contacts?.categories as Record<string, string> | undefined
                )?.[chip.label] ?? chip.label)
          return (
            <button
              key={chip.key}
              onClick={() => onFilterChange(chip.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-msg-filter-active text-msg-filter-active-text"
                  : "bg-msg-filter text-msg-filter-text hover:bg-msg-filter-hover"
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
