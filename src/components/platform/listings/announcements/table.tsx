"use client"

import * as React from "react"
import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Megaphone, Pin, Star } from "lucide-react"

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
import { AnnouncementCreateForm } from "@/components/platform/listings/announcements/form"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/platform/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import {
  deleteAnnouncement,
  getAnnouncements,
  toggleAnnouncementPublish,
} from "./actions"
import type { AnnouncementRow } from "./columns"
import { getAnnouncementColumns } from "./columns"

interface AnnouncementsTableProps {
  initialData: AnnouncementRow[]
  total: number
  dictionary: Dictionary["school"]["announcements"]
  lang: Locale
  perPage?: number
}

/**
 * Get localized title with fallback
 */
function getLocalizedTitle(row: AnnouncementRow, locale: Locale): string {
  if (locale === "ar") {
    return row.titleAr || row.titleEn || ""
  }
  return row.titleEn || row.titleAr || ""
}

// Export CSV function
function createGetAnnouncementsCSV(lang: Locale) {
  return async function getAnnouncementsCSV(
    filters?: Record<string, unknown>
  ): Promise<string> {
    // Get all announcements without pagination for export
    const result = await getAnnouncements({
      page: 1,
      perPage: 1000,
      ...filters,
    })
    if (!result.success || !result.data.rows) return ""

    const rows = result.data.rows
    const headers = [
      "ID",
      "Title (EN)",
      "Title (AR)",
      "Scope",
      "Published",
      "Created At",
      "Created By",
    ]
    const csvRows = rows.map((row) =>
      [
        row.id,
        `"${(row.titleEn || "").replace(/"/g, '""')}"`,
        `"${(row.titleAr || "").replace(/"/g, '""')}"`,
        row.scope,
        row.published ? "Yes" : "No",
        row.createdAt,
        row.createdBy || "",
      ].join(",")
    )

    return [headers.join(","), ...csvRows].join("\n")
  }
}

function AnnouncementsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: AnnouncementsTableProps) {
  const t = dictionary
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  // Search state with debouncing
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  // Build filters object
  const filters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (deferredSearch) f.title = deferredSearch
    return f
  }, [deferredSearch])

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticUpdate,
    optimisticRemove,
    setData,
  } = usePlatformData<AnnouncementRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getAnnouncements({
        ...params,
        title: deferredSearch || undefined,
      })
      if (result.success) {
        return {
          rows: result.data.rows as AnnouncementRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters,
  })

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (announcement: AnnouncementRow) => {
      const displayTitle = getLocalizedTitle(announcement, lang)
      try {
        const ok = await confirmDeleteDialog(
          t.confirmDelete.replace("{title}", displayTitle)
        )
        if (!ok) return

        // Optimistic remove
        optimisticRemove(announcement.id)

        const result = await deleteAnnouncement({ id: announcement.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(result.error || t.failedToDelete)
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : t.failedToDelete)
      }
    },
    [t, lang, optimisticRemove, refresh]
  )

  // Handle toggle publish with optimistic update
  const handleTogglePublish = useCallback(
    async (announcement: AnnouncementRow) => {
      try {
        // Optimistic update
        optimisticUpdate(announcement.id, (item) => ({
          ...item,
          published: !item.published,
        }))

        const result = await toggleAnnouncementPublish({
          id: announcement.id,
          publish: !announcement.published,
        })

        if (!result.success) {
          // Revert on error
          refresh()
          ErrorToast(result.error || t.failedToTogglePublish)
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : t.failedToTogglePublish)
      }
    },
    [t, optimisticUpdate, refresh]
  )

  // Generate columns with dictionary, locale, and optimistic callbacks
  const columns = useMemo(
    () =>
      getAnnouncementColumns(t, lang, {
        onDelete: handleDelete,
        onTogglePublish: handleTogglePublish,
      }),
    [t, lang, handleDelete, handleTogglePublish]
  )

  // Table instance (for table view)
  const { table } = useDataTable<AnnouncementRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true, // Enable client-side column filters
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: title, scope, published, createdAt
        featured: false,
        pinned: false,
        createdBy: false,
      },
    },
  })

  // Handle search (debounced via useDeferredValue)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

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
      router.push(`/announcements/${id}`)
    },
    [router]
  )

  // Get scope badge variant
  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "school":
        return { label: t.schoolWide, variant: "default" as const }
      case "class":
        return { label: t.classSpecific, variant: "secondary" as const }
      case "role":
        return { label: t.roleSpecific, variant: "outline" as const }
      default:
        return { label: scope, variant: "outline" as const }
    }
  }

  // Create locale-aware CSV export function
  const getAnnouncementsCSV = useMemo(
    () => createGetAnnouncementsCSV(lang),
    [lang]
  )

  // Translations for toolbar
  const toolbarTranslations = {
    search: t.announcementTitle,
    create: t.create,
    reset: t.cancel,
    tableView: t.title,
    gridView: t.title,
    export: "Export",
    exportCSV: "Export CSV",
    exporting: "Exporting...",
  }

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.announcementTitle}
        onCreate={() => openModal()}
        getCSV={getAnnouncementsCSV}
        entityName="announcements"
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
              title={t.allAnnouncements}
              description={t.createNewAnnouncement}
              icon={
                <Image
                  src="/anthropic/news.svg"
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((announcement) => {
                const displayTitle = getLocalizedTitle(announcement, lang)
                const scopeBadge = getScopeBadge(announcement.scope)
                return (
                  <GridCard
                    key={announcement.id}
                    icon="/anthropic/news.svg"
                    title={displayTitle}
                    description={announcement.published ? t.published : t.draft}
                    subtitle={scopeBadge.label}
                    onClick={() => handleView(announcement.id)}
                  />
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

      <Modal
        content={
          <AnnouncementCreateForm
            dictionary={t}
            lang={lang}
            onSuccess={refresh}
          />
        }
      />
    </>
  )
}

export const AnnouncementsTable = React.memo(AnnouncementsTableInner)
