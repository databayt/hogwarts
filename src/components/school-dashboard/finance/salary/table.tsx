"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { useDebouncedSearch } from "@/hooks/use-debounced-search"
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

type SalaryColumnsDict = {
  teacher?: string
  employeeId?: string
  baseSalary?: string
  payFrequency?: string
  allowances?: string
  deductions?: string
  status?: string
  active?: string
  inactive?: string
  effectiveFrom?: string
  actions?: string
  view?: string
  edit?: string
  payFrequencyOptions?: Record<string, string>
}

type SalaryConfigDict = {
  searchPlaceholder?: string
  deleteConfirm?: string
}

interface SalaryStructuresTableProps {
  initialData: SalaryStructureRow[]
  total: number
  lang: Locale
  perPage?: number
  columnsDict?: SalaryColumnsDict
  configDict?: SalaryConfigDict
}

function SalaryStructuresTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
  columnsDict,
  configDict,
}: SalaryStructuresTableProps) {
  const router = useRouter()
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)

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
    filters: debouncedSearch ? { search: debouncedSearch } : undefined,
    fetcher: async (params) => {
      // getSalaryStructures(teacherId?, search?) — no teacher scope here, so
      // pass undefined and let the query filter by the typed term.
      const result = await getSalaryStructures(
        undefined,
        typeof params.search === "string" ? params.search : undefined
      )
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      const rows: SalaryStructureRow[] = result.data.map((ss: any) => ({
        id: ss.id,
        teacherName: [ss.teacher?.firstName, ss.teacher?.lastName]
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

  // Generate columns on the client side with lang and dictionary
  const columns = useMemo(
    () => [
      getSelectColumn<SalaryStructureRow>(),
      ...getSalaryStructureColumns(lang, columnsDict),
    ],
    [lang, columnsDict]
  )

  // Table instance
  const { table } = useDataTable<SalaryStructureRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
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
    },
    [setSearchValue]
  )

  // Handle create
  const handleCreate = useCallback(() => {
    router.push(`/${lang}/finance/salary/structures/new`)
  }, [router, lang])

  // Bulk delete handler
  const handleBulkDelete = useCallback(
    async (rows: SalaryStructureRow[]) => {
      const deleteMsg =
        configDict?.deleteConfirm?.replace("{count}", String(rows.length)) ||
        `Delete ${rows.length} salary structure(s)?`
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
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={
          configDict?.searchPlaceholder || "Search salary structures..."
        }
        onCreate={handleCreate}
        entityName="salary-structures"
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

export const SalaryStructuresTable = React.memo(SalaryStructuresTableInner)
