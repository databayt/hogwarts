"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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

import { asset } from "@/lib/asset-url"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Badge } from "@/components/ui/badge"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import {
  deleteAnnouncement,
  getAnnouncements,
  toggleAnnouncementPublish,
} from "./actions"
import type { AnnouncementRow } from "./columns"
import { getAnnouncementColumns } from "./columns"
import { createDraftAnnouncement } from "./wizard/actions"

interface AnnouncementsTableProps {
  initialData: AnnouncementRow[]
  total: number
  dictionary: Dictionary["school"]["announcements"]
  lang: Locale
  perPage?: number
  permissions?: UIPermissions
}

/**
 * Get announcement title
 */
function getTitle(row: AnnouncementRow): string {
  return row.title || ""
}

// Export CSV function
function createGetAnnouncementsCSV(
  lang: Locale,
  csvHeaders: Dictionary["school"]["announcements"]["csvHeaders"]
) {
  return async function getAnnouncementsCSV(
    filters?: Record<string, unknown>
  ): Promise<string> {
    // Get all announcements without pagination for export
    const result = await getAnnouncements({
      page: 1,
      perPage: 1000,
      ...filters,
      displayLang: lang,
    })
    if (!result.success || !result.data.rows) return ""

    const rows = result.data.rows
    const headers = [
      csvHeaders.id,
      csvHeaders.title,
      csvHeaders.language,
      csvHeaders.scope,
      csvHeaders.published,
      csvHeaders.createdAt,
      csvHeaders.createdBy,
    ]
    const csvRows = rows.map((row: any) =>
      [
        row.id,
        `"${(row.title || "").replace(/"/g, '""')}"`,
        row.lang || "ar",
        row.scope,
        row.published ? csvHeaders.yes : csvHeaders.no,
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
  permissions = FULL_UI_PERMISSIONS,
}: AnnouncementsTableProps) {
  const t = dictionary
  const router = useRouter()
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
        displayLang: lang,
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
      const displayTitle = getTitle(announcement)
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
        permissions,
      }),
    [t, lang, handleDelete, handleTogglePublish, permissions]
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

  // Handle create via wizard
  const handleCreate = useCallback(async () => {
    const result = await createDraftAnnouncement()
    if (result.success && result.data) {
      router.push(`/${lang}/announcements/add/${result.data.id}/content`)
    } else {
      ErrorToast(result.error || t.failedToCreate)
    }
  }, [router, lang])

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/${lang}/announcements/add/${id}/content`)
    },
    [router, lang]
  )

  // Handle view
  const handleView = useCallback(
    (id: string) => {
      router.push(`/${lang}/announcements/${id}`)
    },
    [router, lang]
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
    () => createGetAnnouncementsCSV(lang, t.csvHeaders),
    [lang, t.csvHeaders]
  )

  // Translations for toolbar
  const toolbarTranslations = {
    search: t.announcementTitle,
    create: t.create,
    reset: t.cancel,
    tableView: t.tableView,
    gridView: t.gridView,
    export: t.export,
    exportCSV: t.exportCSV,
    exporting: t.exporting,
    view: t.view,
    searchColumns: t.searchColumns,
    noColumns: t.noColumns,
    all: t.all,
  }

  // Translations for the table view's load-more footer and empty state
  const tableTranslations = {
    loadMore: t.loadMore,
    loading: t.loading,
    noResults: t.noResults,
    rowsSelected: t.rowsSelected,
  }

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.announcementTitle}
        onCreate={permissions.showAddButton ? handleCreate : undefined}
        getCSV={permissions.showExportButton ? getAnnouncementsCSV : undefined}
        entityName="announcements"
        exportFormats={["csv", "excel", "pdf"]}
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading || isPending}
          onLoadMore={loadMore}
          translations={tableTranslations}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.allAnnouncements}
              description={t.createNewAnnouncement}
              icon={
                <Image
                  src={asset("/icons/news.svg")}
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((announcement) => {
                const displayTitle = getTitle(announcement)
                const scopeBadge = getScopeBadge(announcement.scope)
                return (
                  <div
                    key={announcement.id}
                    className="bg-background hover:border-primary cursor-pointer rounded-lg border p-4 transition-[border-color] duration-200"
                    onClick={() => handleView(announcement.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-foreground line-clamp-2 font-medium">
                          {displayTitle}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant={
                            announcement.published ? "default" : "outline"
                          }
                        >
                          {announcement.published ? t.published : t.draft}
                        </Badge>
                        <Badge variant={scopeBadge.variant}>
                          {scopeBadge.label}
                        </Badge>
                        {announcement.priority !== "normal" && (
                          <Badge
                            variant={
                              announcement.priority === "urgent"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {announcement.priority === "high"
                              ? t.high
                              : announcement.priority === "urgent"
                                ? t.priority?.urgent?.label || "Urgent"
                                : announcement.priority === "low"
                                  ? t.low
                                  : announcement.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {new Date(announcement.createdAt).toLocaleDateString(
                          lang === "ar" ? "ar-SA" : "en-US"
                        )}
                      </p>
                    </div>
                  </div>
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
                {isLoading ? t.loading : t.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export const AnnouncementsTable = React.memo(AnnouncementsTableInner)
