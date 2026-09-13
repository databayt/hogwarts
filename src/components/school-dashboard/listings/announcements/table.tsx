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

import { asset } from "@/lib/asset-url"
import { formatDate } from "@/lib/i18n-format"
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
  GridEmptyState,
  ItemCard,
  ItemGrid,
  ItemGridMore,
  ListingViews,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import {
  deleteAnnouncement,
  getAnnouncements,
  toggleAnnouncementPublish,
} from "./actions"
import type { AnnouncementRow, ColumnCallbacks } from "./columns"
import { AnnouncementRowActions, getAnnouncementColumns } from "./columns"
import {
  AnnouncementWizardModal,
  type AnnouncementSaveResult,
} from "./wizard/modal"

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
  const [isPending, startTransition] = useTransition()

  // View mode (table/grid). A phone opens on the grid until the reader picks.
  const { view, phoneView, toggleView } = usePlatformView({
    defaultView: "table",
    phoneView: "grid",
  })

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

  // Wizard modal — replaces the /announcements/add/[id] route. Opening costs
  // no server round-trip, so the form paints on the click.
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardId, setWizardId] = useState<string | null>(null)

  const handleCreate = useCallback(() => {
    setWizardId(null)
    setWizardOpen(true)
  }, [])

  const handleEdit = useCallback((id: string) => {
    setWizardId(id)
    setWizardOpen(true)
  }, [])

  // Reconcile the list without a full refetch: patch the edited row in place,
  // and pull the new row from the server only when one was actually created.
  const handleWizardSaved = useCallback(
    (saved: AnnouncementSaveResult) => {
      if (saved.isNew) {
        refresh()
        return
      }
      optimisticUpdate(saved.id, (item) => ({
        ...item,
        title: saved.values.title,
        scope: saved.values.scope,
        priority: saved.values.priority ?? item.priority,
      }))
    },
    [refresh, optimisticUpdate]
  )

  // One set of row callbacks for both views: the table's actions cell and the
  // grid card's menu call exactly the same handlers.
  const rowCallbacks = useMemo<ColumnCallbacks>(
    () => ({
      onDelete: handleDelete,
      onTogglePublish: handleTogglePublish,
      onEdit: (announcement) => handleEdit(announcement.id),
      permissions,
    }),
    [handleDelete, handleTogglePublish, handleEdit, permissions]
  )

  // Generate columns with dictionary, locale, and optimistic callbacks
  const columns = useMemo(
    () => getAnnouncementColumns(t, lang, rowCallbacks),
    [t, lang, rowCallbacks]
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

  const scopeLabel = (scope: string) =>
    scope === "school"
      ? t.schoolWide
      : scope === "class"
        ? t.classSpecific
        : scope === "role"
          ? t.roleSpecific
          : scope

  const priorityLabel = (priority: string) => {
    const levels = t.priority as
      | Record<string, { label?: string } | string>
      | undefined
    const level = levels?.[priority]
    return typeof level === "object" && level?.label ? level.label : priority
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
      <AnnouncementWizardModal
        open={wizardOpen}
        announcementId={wizardId}
        dictionary={t}
        onOpenChange={setWizardOpen}
        onSaved={handleWizardSaved}
      />

      <PlatformToolbar
        table={table}
        view={view}
        phoneView={phoneView}
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

      <ListingViews
        view={view}
        phoneView={phoneView}
        table={
          <DataTable
            table={table}
            paginationMode="load-more"
            hasMore={hasMore}
            isLoading={isLoading || isPending}
            onLoadMore={loadMore}
            translations={tableTranslations}
          />
        }
        grid={
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
              <ItemGrid className="mt-2">
                {data.map((announcement) => (
                  <ItemCard
                    key={announcement.id}
                    href={`/${lang}/announcements/${announcement.id}`}
                    eyebrow={scopeLabel(announcement.scope)}
                    title={getTitle(announcement)}
                    badges={
                      <>
                        {/* On a grey card a `secondary` chip is grey on grey,
                            so the quiet chips sit on the page's own white. */}
                        <Badge
                          variant={
                            announcement.published ? "default" : "outline"
                          }
                          className={
                            announcement.published ? undefined : "bg-background"
                          }
                        >
                          {announcement.published ? t.published : t.draft}
                        </Badge>
                        {announcement.priority === "urgent" ||
                        announcement.priority === "high" ? (
                          <Badge
                            variant={
                              announcement.priority === "urgent"
                                ? "destructive"
                                : "outline"
                            }
                            className={
                              announcement.priority === "urgent"
                                ? undefined
                                : "bg-background"
                            }
                          >
                            {priorityLabel(announcement.priority)}
                          </Badge>
                        ) : null}
                      </>
                    }
                    meta={formatDate(announcement.createdAt, lang)}
                    actions={
                      <AnnouncementRowActions
                        announcement={announcement}
                        dictionary={t}
                        locale={lang}
                        callbacks={rowCallbacks}
                      />
                    }
                  />
                ))}
              </ItemGrid>
            )}

            {hasMore && (
              <ItemGridMore
                onClick={loadMore}
                loading={isLoading}
                label={t.loadMore}
                loadingLabel={t.loading}
              />
            )}
          </>
        }
      />
    </>
  )
}

export const AnnouncementsTable = React.memo(AnnouncementsTableInner)
