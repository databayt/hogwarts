"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"

import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { usePlatformData } from "@/hooks/use-platform-data"
import { Button } from "@/components/ui/button"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteAssignment, getAssignments } from "./actions"
import { AssignmentCard } from "./assignment-card"
import { getAssignmentColumns, type AssignmentRow } from "./columns"
import { ExportButton } from "./export-button"
import { createDraftAssignment } from "./wizard/actions"

interface AssignmentsTableProps {
  initialData: AssignmentRow[]
  total: number
  dictionary?: Dictionary["school"]["assignments"]
  common?: Dictionary["school"]["common"]
  lang: Locale
  perPage?: number
  permissions?: UIPermissions
}

function AssignmentsTableInner({
  initialData,
  total,
  dictionary,
  common,
  lang,
  perPage = 20,
  permissions = FULL_UI_PERMISSIONS,
}: AssignmentsTableProps) {
  const router = useRouter()

  // Translations with fallbacks
  const d = dictionary as Record<string, any> | undefined
  const cm = common as Record<string, any> | undefined
  const t = {
    create: d?.create ?? "",
    loading: d?.loading ?? "",
    empty: d?.empty ?? "",
    loadMore: d?.loadMore ?? "",
  }

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<AssignmentRow, { title?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getAssignments(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return {
        rows: result.data.rows as AssignmentRow[],
        total: result.data.total,
      }
    },
  })

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (assignment: AssignmentRow) => {
      try {
        const deleteLabel = cm?.actions?.delete ?? ""
        const deleteMsg = `${deleteLabel} "${assignment.title}"?`
        const ok = await confirmDeleteDialog(deleteMsg)
        if (!ok) return

        // Optimistic remove
        optimisticRemove(assignment.id)

        const result = await deleteAssignment({ id: assignment.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(cm?.toast?.error?.delete ?? "")
        }
      } catch (e) {
        refresh()
        ErrorToast(cm?.toast?.error?.delete ?? "")
      }
    },
    [optimisticRemove, refresh, cm]
  )

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(
    () =>
      getAssignmentColumns({
        dictionary,
        common,
        lang,
        callbacks: {
          onDelete: handleDelete,
        },
        permissions,
      }),
    [dictionary, common, lang, handleDelete, permissions]
  )

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<AssignmentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: title, type, status, due date
        totalPoints: false,
        createdAt: false,
      },
    },
  })

  // Handle create via wizard
  const handleCreate = useCallback(async () => {
    const result = await createDraftAssignment()
    if (result.success && result.data) {
      router.push(`/${lang}/assignments/add/${result.data.id}/information`)
    } else {
      // `result.error` is a machine code (UNAUTHORIZED …), never user copy.
      ErrorToast(cm?.toast?.error?.create ?? "")
    }
  }, [router, lang, cm])

  return (
    <div className="flex w-full flex-col gap-2.5">
      {/* Filters + create/export. On a phone the controls grow to 44px and the
          search takes a full row. */}
      <DataTableToolbar
        table={table}
        className="max-md:[&_button]:min-h-11 max-md:[&_input]:h-11 max-md:[&_input]:w-full"
      >
        <div className="flex items-center gap-2">
          {permissions.showAddButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="size-11 rounded-full p-0 md:size-8"
              onClick={handleCreate}
              aria-label={t.create}
              title={t.create}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {permissions.showExportButton && (
            <ExportButton
              locale={lang}
              dictionary={d?.export}
              size="sm"
            />
          )}
        </div>
      </DataTableToolbar>

      {/* Phone: stacked cards. md and up: the table. Same `table` state. */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            {t.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {table.getRowModel().rows.map((row) => (
              <AssignmentCard
                key={row.id}
                row={row.original}
                lang={lang}
                dictionary={d}
                common={cm}
                permissions={permissions}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
        {hasMore && (
          <Button
            type="button"
            variant="outline"
            className="mt-3 min-h-11 w-full"
            onClick={loadMore}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading && <Loader2 className="me-2 size-4 animate-spin" />}
            {t.loadMore}
          </Button>
        )}
      </div>

      <div className="hidden md:block">
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  )
}

export const AssignmentsTable = React.memo(AssignmentsTableInner)
