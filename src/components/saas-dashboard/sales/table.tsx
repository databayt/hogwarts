"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLeadColumns, type LeadRow } from "@/components/sales/columns"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteOperatorLead, getOperatorLeads } from "./actions"

type DueFilter = "all" | "today" | "week" | "overdue"
type TierFilter = "all" | "A" | "B" | "C"

interface OperatorSalesTableProps {
  initialData: LeadRow[]
  total: number
  perPage: number
  dictionary?: Dictionary["sales"]
  lang: Locale
}

// Map a UI "due bucket" to an upper-bound timestamp that getOperatorLeads
// compares against `nextFollowUpAt`. Returning `undefined` clears the filter.
function dueBeforeFor(due: DueFilter): Date | undefined {
  switch (due) {
    case "today": {
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      return end
    }
    case "week": {
      const end = new Date()
      const day = end.getDay()
      // Sunday-week: bump to next Saturday end-of-day so a Monday plan still
      // shows Friday's calls.
      const remaining = 6 - day
      end.setDate(end.getDate() + remaining)
      end.setHours(23, 59, 59, 999)
      return end
    }
    case "overdue":
      return new Date()
    case "all":
    default:
      return undefined
  }
}

export function OperatorSalesTable({
  initialData,
  total,
  perPage,
  dictionary,
  lang,
}: OperatorSalesTableProps) {
  const router = useRouter()

  const t = {
    search: dictionary?.search ?? "Search leads...",
    create: dictionary?.create ?? "Create",
    export: dictionary?.export ?? "Export",
    reset: dictionary?.reset ?? "Reset",
    noLeads: dictionary?.noLeads ?? "No leads",
    noLeadsDescription:
      dictionary?.noLeadsDescription ?? "Create a new lead to get started",
    loadMore: dictionary?.loadMore ?? "Load More",
    loading: dictionary?.loading ?? "Loading...",
    network: dictionary?.network ?? "Network",
    tier: dictionary?.filters?.tier ?? "Tier",
    tierAll: dictionary?.filters?.tierAll ?? "All tiers",
    tierA: dictionary?.filters?.tierA ?? "Tier A — warm",
    tierB: dictionary?.filters?.tierB ?? "Tier B — needs intro",
    tierC: dictionary?.filters?.tierC ?? "Tier C — cold",
    due: dictionary?.filters?.due ?? "Due",
    dueAll: dictionary?.filters?.dueAll ?? "Any time",
    dueToday: dictionary?.filters?.dueToday ?? "Due today",
    dueWeek: dictionary?.filters?.dueWeek ?? "Due this week",
    dueOverdue: dictionary?.filters?.dueOverdue ?? "Overdue",
  }

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  // Search state (debounced)
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)

  // "Network" quick-filter: warm private network = source REFERRAL + the
  // `network` tag (sales.mdx workstream 1).
  const [networkOnly, setNetworkOnly] = useState(false)
  const [tier, setTier] = useState<TierFilter>("all")
  const [due, setDue] = useState<DueFilter>("all")

  type Filters = {
    search?: string
    source?: string
    tags?: string[]
    tier?: "A" | "B" | "C"
    dueBefore?: Date
  }
  const filters: Filters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(networkOnly ? { source: "REFERRAL", tags: ["network"] } : {}),
    ...(tier !== "all" ? { tier } : {}),
    ...(dueBeforeFor(due) ? { dueBefore: dueBeforeFor(due) } : {}),
  }
  const hasActiveFilters =
    !!debouncedSearch || networkOnly || tier !== "all" || due !== "all"

  // Data management with optimistic updates
  const { data, isLoading, hasMore, loadMore, refresh } = usePlatformData<
    LeadRow,
    Filters
  >({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getOperatorLeads(
        {
          search: params.search,
          source: params.source as
            | "REFERRAL"
            | "COLD_CALL"
            | "MANUAL"
            | undefined,
          tags: params.tags,
          tier: params.tier,
          dueBefore: params.dueBefore,
        },
        params.page,
        params.perPage
      )
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return {
        rows: result.data.leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          title: lead.title,
          country: lead.country,
          tags: lead.tags,
          status: lead.status as LeadRow["status"],
          source: lead.source,
          priority: lead.priority as LeadRow["priority"],
          score: lead.score,
          verified: lead.verified,
          nextFollowUpAt: lead.nextFollowUpAt
            ? lead.nextFollowUpAt.toISOString()
            : null,
          createdAt: lead.createdAt.toISOString(),
        })),
        total: result.data.total,
      }
    },
    filters: hasActiveFilters ? filters : undefined,
  })

  // Columns — wire operator-side delete action + route-based view/edit so the
  // row dropdown stays inside the platform tenant (no "Missing school context"
  // crash when DEVELOPER hits row Delete).
  const columns = useMemo(
    () =>
      getLeadColumns(dictionary, lang, {
        deleteAction: deleteOperatorLead,
        viewHref: (id) => `/${lang}/sales/${id}`,
        editHref: (id) => `/${lang}/sales/${id}`,
        onDeleteSuccess: () => refresh(),
      }),
    [dictionary, lang, refresh]
  )

  // Table instance
  const { table } = useDataTable<LeadRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
    },
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
    },
    [setSearchValue]
  )

  const goCreate = useCallback(() => {
    router.push(`/${lang}/sales/create`)
  }, [router, lang])

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: t.create,
    reset: t.reset,
    export: t.export,
  }

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={goCreate}
        entityName="leads"
        translations={toolbarTranslations}
        additionalActions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={networkOnly}
              onClick={() => setNetworkOnly((v) => !v)}
              className={cn(
                "h-9",
                networkOnly && "border-primary text-primary"
              )}
            >
              {t.network}
            </Button>

            <Select
              value={tier}
              onValueChange={(v) => setTier(v as TierFilter)}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder={t.tier} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.tierAll}</SelectItem>
                <SelectItem value="A">{t.tierA}</SelectItem>
                <SelectItem value="B">{t.tierB}</SelectItem>
                <SelectItem value="C">{t.tierC}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={due} onValueChange={(v) => setDue(v as DueFilter)}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder={t.due} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.dueAll}</SelectItem>
                <SelectItem value="today">{t.dueToday}</SelectItem>
                <SelectItem value="week">{t.dueWeek}</SelectItem>
                <SelectItem value="overdue">{t.dueOverdue}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 && !isLoading ? (
            <GridEmptyState
              title={t.noLeads}
              description={t.noLeadsDescription}
              icon={
                <Image
                  src={asset("/icons/users.svg")}
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((lead) => {
                const initials = lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
                return (
                  <GridCard
                    key={lead.id}
                    avatar={{ fallback: initials }}
                    title={lead.name}
                    description={lead.company || lead.email || undefined}
                    subtitle={lead.status}
                    onClick={() => router.push(`/${lang}/sales/${lead.id}`)}
                  />
                )
              })}
            </GridContainer>
          )}
          {hasMore && !isLoading && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {t.loadMore}
              </button>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center py-4">
              <span className="text-muted-foreground">{t.loading}</span>
            </div>
          )}
        </>
      )}
    </>
  )
}
