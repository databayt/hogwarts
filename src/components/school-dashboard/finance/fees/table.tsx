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
import { PlatformToolbar } from "@/components/school-dashboard/shared"
import {
  BulkActionsToolbar,
  createDeleteAction,
  createExportAction,
} from "@/components/table/bulk-actions-toolbar"
import { DataTable } from "@/components/table/data-table"
import { getSelectColumn } from "@/components/table/select-column"
import { useDataTable } from "@/components/table/use-data-table"

import { getFeeStructures } from "./actions"
import { getFeeStructureColumns, type FeeStructureRow } from "./columns"

interface FeeStructuresTableProps {
  initialData: FeeStructureRow[]
  total: number
  lang: Locale
  perPage?: number
}

function FeeStructuresTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: FeeStructuresTableProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState("")
  const [isPending, startTransition] = useTransition()

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<FeeStructureRow>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getFeeStructures()
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      const rows: FeeStructureRow[] = result.data.map((fs: any) => ({
        id: fs.id,
        name: fs.name,
        academicYear: fs.academicYear,
        className: fs.class?.name || null,
        totalAmount: Number(fs.totalAmount),
        installments: fs.installments,
        assignmentCount: fs._count?.feeAssignments || 0,
        isActive: fs.isActive,
        createdAt:
          fs.createdAt instanceof Date
            ? fs.createdAt.toISOString()
            : String(fs.createdAt),
      }))
      return { rows, total: rows.length }
    },
  })

  // Generate columns on the client side with lang
  const columns = useMemo(
    () => [getSelectColumn<FeeStructureRow>(), ...getFeeStructureColumns(lang)],
    [lang]
  )

  // Table instance
  const { table } = useDataTable<FeeStructureRow>({
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

  // Handle create
  const handleCreate = useCallback(() => {
    router.push(`/${lang}/finance/fees/structures/new`)
  }, [router, lang])

  // Bulk delete handler
  const handleBulkDelete = useCallback(
    async (rows: FeeStructureRow[]) => {
      const deleteMsg = `Delete ${rows.length} fee structure(s)?`
      const ok = await confirmDeleteDialog(deleteMsg)
      if (!ok) return

      // Optimistically remove all selected rows
      rows.forEach((row) => optimisticRemove(row.id))

      // TODO: Implement bulk delete action
      DeleteToast()
      table.toggleAllPageRowsSelected(false)
    },
    [optimisticRemove, table]
  )

  // Bulk export handler
  const handleBulkExport = useCallback(
    async (rows: FeeStructureRow[]) => {
      const header = "Name,Academic Year,Class,Total Amount,Installments,Active"
      const csv = rows
        .map(
          (r) =>
            `${r.name},${r.academicYear},${r.className || "All Classes"},${r.totalAmount},${r.installments},${r.isActive}`
        )
        .join("\n")
      const csvContent = `${header}\n${csv}`

      // Download
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "fee-structures.csv"
      link.click()
      table.toggleAllPageRowsSelected(false)
    },
    [table]
  )

  // Bulk actions
  const bulkActions = useMemo(
    () => [
      createDeleteAction<FeeStructureRow>(handleBulkDelete, lang),
      createExportAction<FeeStructureRow>(handleBulkExport, lang),
    ],
    [handleBulkDelete, handleBulkExport, lang]
  )

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search fee structures..."
        onCreate={handleCreate}
        entityName="fee-structures"
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

export const FeeStructuresTable = React.memo(FeeStructuresTableInner)
