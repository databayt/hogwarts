"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

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

import { deleteFine, fetchFineRows } from "./actions"
import { getFineColumns, type FineRow } from "./fine-columns"

interface FinesTableProps {
  initialData: FineRow[]
  total: number
  lang: Locale
  perPage?: number
}

function FinesTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: FinesTableProps) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const [searchValue, setSearchValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  const col = (dictionary as any)?.finance?.columns as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined

  const { data, isLoading, hasMore, loadMore, refresh, optimisticRemove } =
    usePlatformData<FineRow, Record<string, unknown>>({
      initialData,
      total,
      perPage,
      fetcher: fetchFineRows,
    })

  const handleSingleDelete = useCallback(
    async (fine: FineRow) => {
      const ok = await confirmDeleteDialog(undefined, {
        title: col?.delete || fc?.delete || "Delete",
        description: fc?.deleteConfirm || "This action cannot be undone.",
        confirmText: col?.delete || fc?.delete || "Delete",
        cancelText: fc?.cancel || "Cancel",
      })
      if (!ok) return
      optimisticRemove(fine.id)
      const result = await deleteFine(fine.id)
      if (result.success) {
        DeleteToast()
      } else {
        refresh()
        ErrorToast(result.error || "Failed to delete")
      }
    },
    [col, fc, optimisticRemove, refresh]
  )

  const columns = useMemo(
    () => [
      getSelectColumn<FineRow>(),
      ...getFineColumns(lang, col, { onDelete: handleSingleDelete }),
    ],
    [lang, col, handleSingleDelete]
  )

  const { table } = useDataTable<FineRow>({
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
    router.push(`/${lang}/finance/fees/fines/new`)
  }, [router, lang])

  const handleBulkExport = useCallback(
    async (rows: FineRow[]) => {
      const header = "Student,Fine Type,Amount,Reason,Due Date,Paid,Waived"
      const csv = rows
        .map(
          (r) =>
            `${r.studentName},${r.fineType},${r.amount},${r.reason},${r.dueDate},${r.isPaid},${r.isWaived}`
        )
        .join("\n")
      const csvContent = `${header}\n${csv}`

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "fines.csv"
      link.click()
      table.toggleAllPageRowsSelected(false)
    },
    [table]
  )

  const bulkActions = useMemo(
    () => [createExportAction<FineRow>(handleBulkExport, lang)],
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
        searchPlaceholder={
          (dictionary as any)?.finance?.fees?.search?.fines || "Search fines..."
        }
        onCreate={handleCreate}
        entityName="fines"
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

export const FinesTable = React.memo(FinesTableInner)
