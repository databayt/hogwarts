"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"

import { formatCurrency } from "@/lib/i18n-format"
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Badge } from "@/components/ui/badge"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  ItemCard,
  ListingViews,
  PlatformToolbar,
  RowActions,
  TableGrid,
} from "@/components/school-dashboard/shared"
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
import { STATUS_COLORS } from "./config"

interface FeeAssignmentsTableProps {
  initialData: FeeAssignmentRow[]
  total: number
  lang: Locale
  perPage?: number
  /** The school's currency — `School.currency`, never a default. */
  currency?: string
}

function FeeAssignmentsTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
  currency,
}: FeeAssignmentsTableProps) {
  const router = useRouter()
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)
  const { view, phoneView, toggleView } = usePlatformView({
    defaultView: "table",
    phoneView: "grid",
  })
  const { dictionary } = useDictionary()
  const col = (dictionary as any)?.finance?.columns as
    | Record<string, string>
    | undefined
  const statusLabel = (status: string) =>
    ({
      PENDING: col?.pending,
      PARTIAL: col?.partial,
      PAID: col?.paid,
      OVERDUE: col?.overdue,
      CANCELLED: col?.cancelled,
    })[status] || status

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
      ...getFeeAssignmentColumns(lang, col, currency),
    ],
    [lang, col, currency]
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
          errors.push(
            `${row.studentName}: ${actionErrorMessage(result.error, dictionary, dictionary?.common?.failedToDelete || "Failed to delete")}`
          )
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
        phoneView={phoneView}
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
      <ListingViews
        view={view}
        phoneView={phoneView}
        table={
          <DataTable
            table={table}
            paginationMode="load-more"
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={loadMore}
          />
        }
        grid={
          <TableGrid
            table={table}
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={loadMore}
          >
            {(row) => {
              const assignment = row.original
              const money = (value: number) =>
                formatCurrency(value, lang, currency || "USD")
              return (
                <ItemCard
                  key={row.id}
                  href={`/${lang}/finance/fees/assignments/${assignment.id}`}
                  eyebrow={assignment.feeStructureName}
                  title={assignment.studentName}
                  value={money(assignment.finalAmount)}
                  badges={
                    <Badge
                      variant="outline"
                      className={
                        STATUS_COLORS[
                          assignment.status as keyof typeof STATUS_COLORS
                        ]
                      }
                    >
                      {statusLabel(assignment.status)}
                    </Badge>
                  }
                  meta={
                    assignment.paidAmount > 0
                      ? `${col?.paid} ${money(assignment.paidAmount)}`
                      : undefined
                  }
                  actions={<RowActions row={row} />}
                />
              )
            }}
          </TableGrid>
        }
      />
      <BulkActionsToolbar table={table} actions={bulkActions} lang={lang} />
    </>
  )
}

export const FeeAssignmentsTable = React.memo(FeeAssignmentsTableInner)
