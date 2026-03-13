"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { confirmDeleteDialog, DeleteToast } from "@/components/atom/toast"
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

import { getSalaryStructures } from "./actions"
import { getSalaryStructureColumns, type SalaryStructureRow } from "./columns"

interface SalaryStructuresTableProps {
  initialData: SalaryStructureRow[]
  total: number
  lang: Locale
  perPage?: number
}

function SalaryStructuresTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: SalaryStructuresTableProps) {
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
  } = usePlatformData<SalaryStructureRow>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getSalaryStructures()
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      const rows: SalaryStructureRow[] = result.data.map((ss: any) => ({
        id: ss.id,
        teacherName: [ss.teacher?.givenName, ss.teacher?.surname]
          .filter(Boolean)
          .join(" "),
        teacherId: ss.teacherId,
        employeeId: ss.teacher?.employeeId || null,
        baseSalary: Number(ss.baseSalary),
        currency: ss.currency,
        payFrequency: ss.payFrequency,
        allowanceCount: ss._count?.allowances || 0,
        deductionCount: ss._count?.deductions || 0,
        isActive: ss.isActive,
        effectiveFrom:
          ss.effectiveFrom instanceof Date
            ? ss.effectiveFrom.toISOString()
            : String(ss.effectiveFrom),
        createdAt:
          ss.createdAt instanceof Date
            ? ss.createdAt.toISOString()
            : String(ss.createdAt),
      }))
      return { rows, total: rows.length }
    },
  })

  // Generate columns on the client side with lang
  const columns = useMemo(
    () => [
      getSelectColumn<SalaryStructureRow>(),
      ...getSalaryStructureColumns(lang),
    ],
    [lang]
  )

  // Table instance
  const { table } = useDataTable<SalaryStructureRow>({
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
    router.push(`/${lang}/finance/salary/structures/new`)
  }, [router, lang])

  // Bulk delete handler
  const handleBulkDelete = useCallback(
    async (rows: SalaryStructureRow[]) => {
      const deleteMsg = `Delete ${rows.length} salary structure(s)?`
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
    async (rows: SalaryStructureRow[]) => {
      const header =
        "Teacher,Employee ID,Base Salary,Currency,Pay Frequency,Allowances,Deductions,Active"
      const csv = rows
        .map(
          (r) =>
            `${r.teacherName},${r.employeeId || "-"},${r.baseSalary},${r.currency},${r.payFrequency},${r.allowanceCount},${r.deductionCount},${r.isActive}`
        )
        .join("\n")
      const csvContent = `${header}\n${csv}`

      // Download
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "salary-structures.csv"
      link.click()
      table.toggleAllPageRowsSelected(false)
    },
    [table]
  )

  // Bulk actions
  const bulkActions = useMemo(
    () => [
      createDeleteAction<SalaryStructureRow>(handleBulkDelete, lang),
      createExportAction<SalaryStructureRow>(handleBulkExport, lang),
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
        searchPlaceholder="Search salary structures..."
        onCreate={handleCreate}
        entityName="salary-structures"
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

export const SalaryStructuresTable = React.memo(SalaryStructuresTableInner)
