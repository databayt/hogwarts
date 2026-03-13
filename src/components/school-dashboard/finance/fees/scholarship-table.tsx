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
  const [searchValue, setSearchValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  const { data, isLoading, hasMore, loadMore } = usePlatformData<
    ScholarshipRow,
    Record<string, unknown>
  >({
    initialData,
    total,
    perPage,
    fetcher: async () => ({ rows: [], total: 0 }),
  })

  const columns = useMemo(
    () => [getSelectColumn<ScholarshipRow>(), ...getScholarshipColumns(lang)],
    [lang]
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

  const bulkActions = useMemo(
    () => [createExportAction<ScholarshipRow>(handleBulkExport, lang)],
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
        searchPlaceholder="Search scholarships..."
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
