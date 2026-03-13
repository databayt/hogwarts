"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import type { Locale } from "@/components/internationalization/config"
import { PlatformToolbar } from "@/components/school-dashboard/shared"
import {
  BulkActionsToolbar,
  createExportAction,
} from "@/components/table/bulk-actions-toolbar"
import { DataTable } from "@/components/table/data-table"
import { getSelectColumn } from "@/components/table/select-column"
import { useDataTable } from "@/components/table/use-data-table"

import { fetchAssignmentRows } from "./actions"
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
  const [searchValue, setSearchValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  const { data, isLoading, hasMore, loadMore } = usePlatformData<
    FeeAssignmentRow,
    Record<string, unknown>
  >({
    initialData,
    total,
    perPage,
    fetcher: fetchAssignmentRows,
  })

  const columns = useMemo(
    () => [
      getSelectColumn<FeeAssignmentRow>(),
      ...getFeeAssignmentColumns(lang),
    ],
    [lang]
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
      startTransition(() => {
        router.refresh()
      })
    },
    [router]
  )

  const handleCreate = useCallback(() => {
    router.push(`/${lang}/finance/fees/assignments/new`)
  }, [router, lang])

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
    () => [createExportAction<FeeAssignmentRow>(handleBulkExport, lang)],
    [handleBulkExport, lang]
  )

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search assignments..."
        onCreate={handleCreate}
        entityName="fee-assignments"
      />
      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading || isPending}
        onLoadMore={loadMore}
      />
      <BulkActionsToolbar table={table} actions={bulkActions} lang={lang} />
    </>
  )
}

export const FeeAssignmentsTable = React.memo(FeeAssignmentsTableInner)
