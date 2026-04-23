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

import { deleteScholarship, fetchScholarshipRows } from "./actions"
import {
  getScholarshipColumns,
  type ScholarshipRow,
} from "./scholarship-columns"

interface ScholarshipsTableProps {
  initialData: ScholarshipRow[]
  total: number
  lang: Locale
  perPage?: number
}

function ScholarshipsTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: ScholarshipsTableProps) {
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
    usePlatformData<ScholarshipRow, Record<string, unknown>>({
      initialData,
      total,
      perPage,
      fetcher: fetchScholarshipRows,
    })

  const handleSingleDelete = useCallback(
    async (scholarship: ScholarshipRow) => {
      const ok = await confirmDeleteDialog(undefined, {
        title: col?.delete || fc?.delete || "Delete",
        description: fc?.deleteConfirm || "This action cannot be undone.",
        confirmText: col?.delete || fc?.delete || "Delete",
        cancelText: fc?.cancel || "Cancel",
      })
      if (!ok) return
      optimisticRemove(scholarship.id)
      const result = await deleteScholarship(scholarship.id)
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
      getSelectColumn<ScholarshipRow>(),
      ...getScholarshipColumns(lang, col, { onDelete: handleSingleDelete }),
    ],
    [lang, col, handleSingleDelete]
  )

  const { table } = useDataTable<ScholarshipRow>({
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
    router.push(`/${lang}/finance/fees/scholarships/new`)
  }, [router, lang])

  const handleBulkExport = useCallback(
    async (rows: ScholarshipRow[]) => {
      const header =
        "Name,Type,Coverage Amount,Academic Year,Beneficiaries,Active"
      const csv = rows
        .map(
          (r) =>
            `${r.name},${r.coverageType},${r.coverageAmount},${r.academicYear},${r.currentBeneficiaries},${r.isActive}`
        )
        .join("\n")
      const csvContent = `${header}\n${csv}`

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "scholarships.csv"
      link.click()
      table.toggleAllPageRowsSelected(false)
    },
    [table]
  )

  const handleBulkDelete = useCallback(
    async (rows: ScholarshipRow[]) => {
      const ok = await confirmDeleteDialog(undefined, {
        title: col?.delete || fc?.delete || "Delete",
        description:
          fc?.deleteConfirm ||
          `Delete ${rows.length} selected items? This action cannot be undone.`,
        confirmText: col?.delete || fc?.delete || "Delete",
        cancelText: fc?.cancel || "Cancel",
      })
      if (!ok) return
      for (const row of rows) {
        optimisticRemove(row.id)
        const result = await deleteScholarship(row.id)
        if (!result.success) {
          refresh()
          ErrorToast(result.error || "Failed to delete")
          return
        }
      }
      DeleteToast()
      table.toggleAllPageRowsSelected(false)
    },
    [col, fc, optimisticRemove, refresh, table]
  )

  const bulkActions = useMemo(
    () => [
      createDeleteAction<ScholarshipRow>(handleBulkDelete, lang),
      createExportAction<ScholarshipRow>(handleBulkExport, lang),
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
          (dictionary as any)?.finance?.fees?.search?.scholarships ||
          "Search scholarships..."
        }
        onCreate={handleCreate}
        entityName="scholarships"
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

export const ScholarshipsTable = React.memo(ScholarshipsTableInner)
