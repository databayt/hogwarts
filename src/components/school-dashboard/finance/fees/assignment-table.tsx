"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"

import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { PlatformToolbar } from "@/components/school-dashboard/shared"
import {
  BulkActionsToolbar,
  createDeleteAction,
  createExportAction,
} from "@/components/table/bulk-actions-toolbar"
import { DataTable } from "@/components/table/data-table"
import { getSelectColumn } from "@/components/table/select-column"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteFeeAssignment, fetchAssignmentRows } from "./actions"
import {
  getFeeAssignmentColumns,
  type FeeAssignmentRow,
} from "./assignment-columns"

interface FeeAssignmentsTableProps {
  initialData: FeeAssignmentRow[]
  total: number
  lang: Locale
  perPage?: number
}

function FeeAssignmentsTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: FeeAssignmentsTableProps) {
  const router = useRouter()
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })
  const { dictionary } = useDictionary()
  const col = (dictionary as any)?.finance?.columns as
    | Record<string, string>
    | undefined

  const { data, isLoading, hasMore, loadMore } = usePlatformData<
    FeeAssignmentRow,
    { search?: string }
  >({
    initialData,
    total,
    perPage,
    fetcher: fetchAssignmentRows,
    filters: debouncedSearch ? { search: debouncedSearch } : undefined,
  })

  const columns = useMemo(
    () => [
      getSelectColumn<FeeAssignmentRow>(),
      ...getFeeAssignmentColumns(lang, col),
    ],
    [lang, col]
  )

  const { table } = useDataTable<FeeAssignmentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        createdAt: false,
      },
    },
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
    },
    [setSearchValue]
  )

  const handleCreate = useCallback(() => {
    router.push(`/${lang}/finance/fees/assignments/new`)
  }, [router, lang])

  const handleBulkDelete = useCallback(
    async (rows: FeeAssignmentRow[]) => {
      const ok = await confirmDeleteDialog(
        `Delete ${rows.length} assignment(s)?`
      )
      if (!ok) return

      const errors: string[] = []
      for (const row of rows) {
        const result = await deleteFeeAssignment(row.id)
        if (!result.success) {
          errors.push(`${row.studentName}: ${result.error}`)
        }
      }

      if (errors.length > 0) {
        ErrorToast(errors.join("\n"))
      } else {
        DeleteToast()
      }
      table.toggleAllPageRowsSelected(false)
    },
    [table]
  )

  const handleBulkExport = useCallback(
    async (rows: FeeAssignmentRow[]) => {
      const header = "Student,Fee Structure,Amount,Status"
      const csv = rows
        .map(
          (r) =>
            `${r.studentName},${r.feeStructureName},${r.finalAmount},${r.status}`
        )
        .join("\n")
      const csvContent = `${header}\n${csv}`

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "fee-assignments.csv"
      link.click()
      table.toggleAllPageRowsSelected(false)
    },
    [table]
  )

  const bulkActions = useMemo(
    () => [
      createDeleteAction<FeeAssignmentRow>(handleBulkDelete, lang),
      createExportAction<FeeAssignmentRow>(handleBulkExport, lang),
    ],
    [handleBulkDelete, handleBulkExport, lang]
  )

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={
          (dictionary as any)?.finance?.fees?.search?.assignments ||
          "Search assignments..."
        }
        onCreate={handleCreate}
        entityName="fee-assignments"
      />
      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={loadMore}
      />
      <BulkActionsToolbar table={table} actions={bulkActions} lang={lang} />
    </>
  )
}

export const FeeAssignmentsTable = React.memo(FeeAssignmentsTableInner)
