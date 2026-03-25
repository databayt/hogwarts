"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { SidebarFilter } from "./types"

export interface ContactSearchProps {
  search: string
  onSearchChange: (value: string) => void
  activeFilter: SidebarFilter
  onFilterChange: (filter: SidebarFilter) => void
  filterChips: { key: SidebarFilter; label: string }[]
  unreadCount?: number
  locale?: "ar" | "en"
}

export function ContactSearch({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filterChips,
  unreadCount = 0,
  locale = "en",
}: ContactSearchProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging

  const getLabel = (chip: { key: SidebarFilter; label: string }) => {
    if (chip.key === "all") {
      return m?.contacts?.filter_all ?? (locale === "ar" ? "الكل" : "All")
    }
    if (chip.key === "unread") {
      const base =
        m?.contacts?.unread ?? (locale === "ar" ? "غير مقروءة" : "Unread")
      return unreadCount > 0 ? `${base} (${unreadCount})` : base
    }
    if (chip.key === "favourites") {
      return (
        m?.contacts?.favourites ?? (locale === "ar" ? "المفضلة" : "Favourites")
      )
    }
    // Role category
    const categories = m?.contacts?.categories as
      | Record<string, string>
      | undefined
    return categories?.[chip.label] ?? chip.label
  }

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
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => onFilterChange(chip.key)}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-msg-unread-badge text-white"
                  : "bg-msg-hover text-foreground hover:bg-msg-hover/80"
              )}
            >
              {getLabel(chip)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
