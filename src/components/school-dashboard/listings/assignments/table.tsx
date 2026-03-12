"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

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
}

function AssignmentsTableInner({
  initialData,
  total,
  dictionary,
  common,
  lang,
  perPage = 20,
}: AssignmentsTableProps) {
  const router = useRouter()

  // Translations with fallbacks
  const t = {
    create: dictionary?.create || "Create",
    loading: "Loading...",
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
        const deleteMsg = `Delete "${assignment.title}"?`
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
          ErrorToast("Failed to delete assignment")
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : "Failed to delete")
      }
    },
    [optimisticRemove, refresh]
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
      }),
    [dictionary, common, lang, handleDelete]
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
        // Default visible: title, className, dueDate, status
        type: false,
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
      ErrorToast(result.error || "Failed to create")
    }
  }, [router, lang])

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={loadMore}
    >
      <DataTableToolbar table={table}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={handleCreate}
            aria-label={t.create}
            title={t.create}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <ExportButton />
        </div>
      </DataTableToolbar>
    </DataTable>
  )
}

export const AssignmentsTable = React.memo(AssignmentsTableInner)
