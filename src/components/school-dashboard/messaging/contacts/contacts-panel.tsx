"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState } from "react"
import { Users } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { CATEGORY_DICT_KEYS, getFilterChips } from "./config"
import { ContactCardSkeleton } from "./contact-card"
import { ContactCategorySection } from "./contact-category"
import { ContactSearch } from "./contact-search"
import type { ContactCategory, ContactGroup } from "./types"

export interface ContactsPanelProps {
  currentUserRole: string
  locale?: "ar" | "en"
  onContactClick?: (userId: string) => void
  className?: string
}

export function ContactsPanel({
  currentUserRole,
  locale = "en",
  onContactClick,
  className,
}: ContactsPanelProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<ContactCategory | "all">(
    "all"
  )

  const filterChips = useMemo(
    () => getFilterChips(currentUserRole),
    [currentUserRole]
  )

  // Fetch contacts
  const fetchContacts = useCallback(async (searchQuery?: string) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchQuery && searchQuery.length >= 2) {
        params.set("search", searchQuery)
      }
      const res = await fetch(`/api/contacts?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups ?? [])
      }
    } catch (error) {
      console.error("[ContactsPanel] Error fetching contacts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Debounced search
  const debouncedSearch = useDebouncedCallback((value: string) => {
    fetchContacts(value)
  }, 300)

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  // Filter groups by active category
  const filteredGroups = useMemo(() => {
    if (activeFilter === "all") return groups
    return groups.filter((g) => g.category === activeFilter)
  }, [groups, activeFilter])

  // Total contact count
  const totalCount = filteredGroups.reduce(
    (sum, g) => sum + g.contacts.length,
    0
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Search + filters */}
      <ContactSearch
        search={search}
        onSearchChange={handleSearchChange}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        filterChips={filterChips}
        locale={locale}
      />

      {/* Contact list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <ContactCardSkeleton key={i} />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="text-muted-foreground mb-3 h-12 w-12 opacity-40" />
            <p className="text-muted-foreground text-sm">
              {search
                ? (m?.contacts?.no_results ??
                  (locale === "ar" ? "لا توجد نتائج" : "No contacts found"))
                : (m?.contacts?.no_contacts ??
                  (locale === "ar"
                    ? "لا توجد جهات اتصال"
                    : "No contacts available"))}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const categoryKey = CATEGORY_DICT_KEYS[group.category]
            const categories = m?.contacts?.categories as
              | Record<string, string>
              | undefined
            const label = categories?.[categoryKey] ?? categoryKey
            return (
              <ContactCategorySection
                key={group.category}
                label={label}
                contacts={group.contacts}
                locale={locale}
                onContactClick={onContactClick}
              />
            )
          })
        )}
      </ScrollArea>
    </div>
  )
}
