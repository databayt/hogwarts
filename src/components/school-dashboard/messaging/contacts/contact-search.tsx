"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Search, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import type { WhatsAppSessionDTO } from "@/components/school-dashboard/whatsapp/types"

import { WhatsAppSettingsDialog } from "../whatsapp-settings-dialog"
import type { SidebarFilter } from "./types"

export interface ContactSearchProps {
  search: string
  onSearchChange: (value: string) => void
  activeFilter: SidebarFilter
  onFilterChange: (filter: SidebarFilter) => void
  filterChips: { key: SidebarFilter; label: string }[]
  unreadCount?: number
  locale?: "ar" | "en"
  whatsappSession?: WhatsAppSessionDTO | null
}

export function ContactSearch({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filterChips,
  unreadCount = 0,
  locale = "en",
  whatsappSession = null,
}: ContactSearchProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging

  const getLabel = (chip: { key: SidebarFilter; label: string }) => {
    if (chip.key === "all") {
      return m?.contacts?.filter_all ?? "All"
    }
    if (chip.key === "unread") {
      const base = m?.contacts?.unread ?? "Unread"
      return unreadCount > 0 ? `${base} (${unreadCount})` : base
    }
    if (chip.key === "favourites") {
      return m?.contacts?.favourites ?? "Favourites"
    }
    // Role category
    const categories = m?.contacts?.categories as
      | Record<string, string>
      | undefined
    return categories?.[chip.label] ?? chip.label
  }

  return (
    <div className="space-y-4 px-6 pt-4">
      {/* Title + settings */}
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-foreground text-xl font-bold">
          {m?.ui?.chats || "Chats"}
        </h2>
        <WhatsAppSettingsDialog session={whatsappSession}>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </WhatsAppSettingsDialog>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={m?.ui?.search || "Search"}
          className={cn(
            "border-border text-msg-search-text placeholder:text-msg-search-placeholder w-full rounded-lg border bg-transparent py-1.5 ps-9 pe-3 text-sm",
            "focus:ring-ring focus:ring-1 focus:outline-none"
          )}
        />
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => onFilterChange(chip.key)}
              className={cn(
                "flex-shrink-0 rounded-full border px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "border-[#C8E6C3] bg-[#D9FDD4] text-[#15603E]"
                  : "hover:bg-muted/50 border-[#d1d5db] bg-transparent text-[#6A6C6C]"
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
