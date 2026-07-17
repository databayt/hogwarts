"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { asset } from "@/lib/asset-url"
import { formatDate } from "@/lib/i18n-format"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteEvent, getEvents, getEventsCSV } from "./actions"
import { getEventColumns, type EventRow } from "./columns"
import { createDraftEvent } from "./wizard/actions"

interface EventsTableProps {
  initialData: EventRow[]
  total: number
  dictionary?: Dictionary["school"]["events"]
  lang: Locale
  perPage?: number
  permissions?: UIPermissions
}

function EventsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  permissions = FULL_UI_PERMISSIONS,
}: EventsTableProps) {
  const router = useRouter()

  // Translations with fallbacks
  const t = {
    // `dictionary.title` is the *page* title ("Events"), not the column header.
    title: dictionary?.titleColumn || "Title",
    type: dictionary?.type || "Type",
    date: dictionary?.date || "Date",
    location: dictionary?.location || "Location",
    organizer: dictionary?.organizer || "Organizer",
    attendees: dictionary?.attendees || "Attendees",
    status: dictionary?.status || "Status",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.view || "View",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
    allEvents: dictionary?.allEvents || "All Events",
    addNewEvent: dictionary?.addNewEvent || "Schedule a new school event",
    search:
      dictionary?.searchPlaceholder || dictionary?.search || "Search events...",
    create: dictionary?.create || "Create",
    export: dictionary?.export || "Export",
    reset: dictionary?.reset || "Reset",
  }

  // Grid view renders the same enums as the table — resolve via the same map.
  const eventTypeLabel = useCallback(
    (value: string) => {
      const types = dictionary?.types as Record<string, string> | undefined
      return types?.[value] ?? value.replace("_", " ")
    },
    [dictionary]
  )

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  // Search state (debounced)
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<EventRow, { title?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      // Forward the locale so search/load-more rows are translated and their
      // placeholder labels resolved the same way the SSR first page is.
      const result = await getEvents({ ...params, displayLang: lang })
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows as EventRow[], total: result.data.total }
    },
    filters: debouncedSearch ? { title: debouncedSearch } : undefined,
  })

  // Handle search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
    },
    [setSearchValue]
  )

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (event: EventRow) => {
      try {
        const deleteMsg = `${dictionary?.delete || "Delete"} "${event.title}"?`
        const d = dictionary as Record<string, any> | undefined
        const ok = await confirmDeleteDialog(deleteMsg, {
          title: deleteMsg,
          description: d?.deleteConfirm,
          confirmText: d?.delete || "Delete",
          cancelText: d?.cancel || "Cancel",
        })
        if (!ok) return

        // Optimistic remove
        optimisticRemove(event.id)

        const result = await deleteEvent({ id: event.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(
            dictionary?.failedToDeleteEvent || "Failed to delete event"
          )
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : dictionary?.failedToDeleteEvent || "Failed to delete"
        )
      }
    },
    [optimisticRemove, refresh, lang]
  )

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(
    () =>
      getEventColumns(dictionary, lang, {
        onDelete: handleDelete,
        permissions,
      }),
    [dictionary, lang, handleDelete, permissions]
  )

  // Table instance
  const { table } = useDataTable<EventRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: title, eventType, eventDate, status
        location: false,
        currentAttendees: false,
        maxAttendees: false,
        isPublic: false,
        createdAt: false,
      },
    },
  })

  // Handle create via wizard
  const handleCreate = useCallback(async () => {
    const result = await createDraftEvent()
    if (result.success && result.data) {
      router.push(`/${lang}/events/add/${result.data.id}/information`)
    } else {
      ErrorToast(
        result.error || dictionary?.failedToCreate || "Failed to create"
      )
    }
  }, [router, lang, dictionary])

  // Handle view
  const handleView = useCallback(
    (id: string) => {
      router.push(`/${lang}/events/${id}`)
    },
    [router, lang]
  )

  // Export CSV wrapper
  const handleExportCSV = useCallback(
    async (filters?: Record<string, unknown>) => {
      const result = await getEventsCSV({ ...filters, displayLang: lang })
      if (!result.success || !result.data) {
        throw new Error("error" in result ? result.error : "Export failed")
      }
      return result.data
    },
    [lang]
  )

  // Translations for the table view's load-more footer and empty state
  const tableTranslations = {
    loadMore: dictionary?.loadMore || "Load More",
    loading: dictionary?.loading || "Loading...",
    noResults: dictionary?.noResults || "No results.",
    rowsSelected: dictionary?.rowsSelected || "row(s) selected.",
  }

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: typeof t.create === "string" ? t.create : t.addNewEvent,
    reset: t.reset,
    export: t.export,
    exportCSV: dictionary?.exportCSV || "Export CSV",
    exporting: dictionary?.exporting || "Exporting...",
    view: t.view,
    tableView: dictionary?.tableView || "Table",
    gridView: dictionary?.gridView || "Grid",
    switchToTable: dictionary?.switchToTable || "Switch to table view",
    switchToGrid: dictionary?.switchToGrid || "Switch to grid view",
    searchColumns: dictionary?.searchColumns || "Search columns...",
    noColumns: dictionary?.noColumns || "No columns found.",
    all: dictionary?.all || "All",
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
        onCreate={permissions.showAddButton ? handleCreate : undefined}
        getCSV={permissions.showExportButton ? handleExportCSV : undefined}
        entityName="events"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          translations={tableTranslations}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.allEvents}
              description={t.addNewEvent}
              icon={
                <Image
                  src={asset("/illustrations/category-01.svg")}
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((event) => (
                <GridCard
                  key={event.id}
                  icon={asset("/illustrations/category-01.svg")}
                  title={event.title}
                  description={formatDate(event.eventDate, lang)}
                  subtitle={eventTypeLabel(event.eventType)}
                  onClick={() => handleView(event.id)}
                />
              ))}
            </GridContainer>
          )}

          {/* Load more for grid view */}
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isLoading
                  ? dictionary?.loading || "Loading..."
                  : dictionary?.loadMore || "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export const EventsTable = React.memo(EventsTableInner)
