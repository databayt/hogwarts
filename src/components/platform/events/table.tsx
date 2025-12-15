"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
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
import { EventCreateForm } from "@/components/platform/events/form"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/platform/shared"
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

export function EventsTable({
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
    title: dictionary?.title || (lang === "ar" ? "العنوان" : "Title"),
    type: dictionary?.type || (lang === "ar" ? "النوع" : "Type"),
    date: dictionary?.date || (lang === "ar" ? "التاريخ" : "Date"),
    location: dictionary?.location || (lang === "ar" ? "الموقع" : "Location"),
    organizer:
      dictionary?.organizer || (lang === "ar" ? "المنظم" : "Organizer"),
    attendees:
      dictionary?.attendees || (lang === "ar" ? "الحضور" : "Attendees"),
    status: dictionary?.status || (lang === "ar" ? "الحالة" : "Status"),
    actions: lang === "ar" ? "إجراءات" : "Actions",
    view: lang === "ar" ? "عرض" : "View",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
    allEvents:
      dictionary?.allEvents || (lang === "ar" ? "جميع الأحداث" : "All Events"),
    addNewEvent:
      dictionary?.addNewEvent ||
      (lang === "ar" ? "جدولة حدث مدرسي جديد" : "Schedule a new school event"),
    search:
      dictionary?.search ||
      (lang === "ar" ? "بحث في الأحداث..." : "Search events..."),
    create: dictionary?.create || (lang === "ar" ? "إنشاء" : "Create"),
    export: dictionary?.export || (lang === "ar" ? "تصدير" : "Export"),
    reset: dictionary?.reset || (lang === "ar" ? "إعادة تعيين" : "Reset"),
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
        const deleteMsg =
          lang === "ar" ? `حذف "${event.title}"؟` : `Delete "${event.title}"?`
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
          ErrorToast(lang === "ar" ? "فشل حذف الحدث" : "Failed to delete event")
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : lang === "ar"
              ? "فشل الحذف"
              : "Failed to delete"
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
    exportCSV: lang === "ar" ? "تصدير CSV" : "Export CSV",
    exporting: lang === "ar" ? "جاري التصدير..." : "Exporting...",
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
              icon={<Calendar className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((event) => {
                const initials = event.title
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
                const statusBadge = getStatusBadge(event.status)

                return (
                  <GridCard
                    key={event.id}
                    title={event.title}
                    subtitle={new Date(event.eventDate).toLocaleDateString()}
                    avatarFallback={initials}
                    status={statusBadge}
                    metadata={[
                      {
                        label: t.type,
                        value: event.eventType.replace("_", " "),
                      },
                      {
                        label: t.location,
                        value: (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        ),
                      },
                      {
                        label: t.attendees,
                        value: (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.currentAttendees}
                            {event.maxAttendees ? `/${event.maxAttendees}` : ""}
                          </span>
                        ),
                      },
                    ]}
                    actions={[
                      { label: t.view, onClick: () => handleView(event.id) },
                      { label: t.edit, onClick: () => handleEdit(event.id) },
                      {
                        label: t.delete,
                        onClick: () => handleDelete(event),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => handleView(event.id)}
                  >
                    <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                      <span>
                        {event.startTime} - {event.endTime}
                      </span>
                      {event.isPublic && (
                        <Badge variant="outline" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                  </GridCard>
                )
              })}
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
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <Modal content={<EventCreateForm onSuccess={refresh} />} />
    </>
  )
}
