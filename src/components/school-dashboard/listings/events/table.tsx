"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Calendar, MapPin, Users } from "lucide-react"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Badge } from "@/components/ui/badge"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { EventCreateForm } from "@/components/school-dashboard/listings/events/form"
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

interface EventsTableProps {
  initialData: EventRow[]
  total: number
  dictionary?: Dictionary["school"]["events"]
  lang: Locale
  perPage?: number
}

function EventsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: EventsTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations with fallbacks
  const t = {
    title: dictionary?.title || "Title",
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
    search: dictionary?.search || "Search events...",
    create: dictionary?.create || "Create",
    export: dictionary?.export || "Export",
    reset: dictionary?.reset || "Reset",
  }

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  // Search state
  const [searchValue, setSearchValue] = useState("")

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
      const result = await getEvents(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows as EventRow[], total: result.data.total }
    },
    filters: searchValue ? { title: searchValue } : undefined,
  })

  // Handle search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      startTransition(() => {
        router.refresh()
      })
    },
    [router]
  )

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (event: EventRow) => {
      try {
        const deleteMsg = `${dictionary?.delete || "Delete"} "${event.title}"?`
        const ok = await confirmDeleteDialog(deleteMsg)
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
      }),
    [dictionary, lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<EventRow>({
    data,
    columns,
    pageCount: 1,
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

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      openModal(id)
    },
    [openModal]
  )

  // Handle view
  const handleView = useCallback(
    (id: string) => {
      router.push(`/events/${id}`)
    },
    [router]
  )

  // Export CSV wrapper
  const handleExportCSV = useCallback(
    async (filters?: Record<string, unknown>) => {
      const result = await getEventsCSV(filters)
      if (!result.success || !result.data) {
        throw new Error("error" in result ? result.error : "Export failed")
      }
      return result.data
    },
    []
  )

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PLANNED: "default",
      IN_PROGRESS: "secondary",
      COMPLETED: "outline",
      CANCELLED: "destructive",
    }
    return {
      label: status.replace("_", " "),
      variant: variants[status] || "default",
    }
  }

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: typeof t.create === "string" ? t.create : t.addNewEvent,
    reset: t.reset,
    export: t.export,
    exportCSV: dictionary?.exportCSV || "Export CSV",
    exporting: dictionary?.exporting || "Exporting...",
  }

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={() => openModal()}
        getCSV={handleExportCSV}
        entityName="events"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading || isPending}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.allEvents}
              description={t.addNewEvent}
              icon={
                <Image
                  src="/anthropic/category-01.svg"
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
                  icon="/anthropic/category-01.svg"
                  title={event.title}
                  description={new Date(event.eventDate).toLocaleDateString()}
                  subtitle={event.eventType?.replace("_", " ")}
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

      <Modal
        content={
          <EventCreateForm
            onSuccess={refresh}
            lang={lang}
            dictionary={dictionary}
          />
        }
      />
    </>
  )
}

export const EventsTable = React.memo(EventsTableInner)
