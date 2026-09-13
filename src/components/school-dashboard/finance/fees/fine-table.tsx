"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
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

import { deleteFine, fetchFineRows } from "./actions"
import { STATUS_COLORS } from "./config"
import { getFineColumns, type FineRow } from "./fine-columns"

interface FinesTableProps {
  initialData: FineRow[]
  total: number
  lang: Locale
  perPage?: number
  /** The school's currency — `School.currency`, never a default. */
  currency?: string
}

function FinesTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
  currency,
}: FinesTableProps) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)
  const { view, phoneView, toggleView } = usePlatformView({
    defaultView: "table",
    phoneView: "grid",
  })

  const col = (dictionary as any)?.finance?.columns as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined
  const ff = (dictionary as any)?.finance?.fineForm as
    | Record<string, string>
    | undefined
  const fineTypeLabel = (type: string) =>
    ({
      LATE_FEE: ff?.lateFee,
      LIBRARY_FINE: ff?.libraryFine,
      DISCIPLINE_FINE: ff?.disciplineFine,
      DAMAGE_FINE: ff?.damageFine,
      OTHER: ff?.other,
    })[type] || type.replace(/_/g, " ")
  // The column's rule: waived beats paid beats overdue.
  const fineStatus = (fine: FineRow) =>
    fine.isWaived
      ? { tone: STATUS_COLORS.CANCELLED, label: col?.waived }
      : fine.isPaid
        ? { tone: STATUS_COLORS.PAID, label: col?.paid }
        : fine.dueDate && new Date(fine.dueDate) < new Date()
          ? { tone: STATUS_COLORS.OVERDUE, label: col?.overdue }
          : { tone: STATUS_COLORS.PENDING, label: col?.pending }

  const { data, isLoading, hasMore, loadMore, refresh, optimisticRemove } =
    usePlatformData<FineRow, { search?: string }>({
      initialData,
      total,
      perPage,
      fetcher: fetchFineRows,
      filters: debouncedSearch ? { search: debouncedSearch } : undefined,
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
        ErrorToast(
          actionErrorMessage(
            result.error,
            dictionary,
            dictionary?.common?.failedToDelete || "Failed to delete"
          )
        )
      }
    },
    [col, fc, optimisticRemove, refresh]
  )

  const columns = useMemo(
    () => [
      getSelectColumn<FineRow>(),
      ...getFineColumns(lang, col, { onDelete: handleSingleDelete }, currency),
    ],
    [lang, col, handleSingleDelete, currency]
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
    },
    [setSearchValue]
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

  const handleBulkDelete = useCallback(
    async (rows: FineRow[]) => {
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
        const result = await deleteFine(row.id)
        if (!result.success) {
          refresh()
          ErrorToast(
            actionErrorMessage(
              result.error,
              dictionary,
              dictionary?.common?.failedToDelete || "Failed to delete"
            )
          )
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
      createDeleteAction<FineRow>(handleBulkDelete, lang),
      createExportAction<FineRow>(handleBulkExport, lang),
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
          (dictionary as any)?.finance?.fees?.search?.fines || "Search fines..."
        }
        onCreate={handleCreate}
        entityName="fines"
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
              const fine = row.original
              const status = fineStatus(fine)
              return (
                <ItemCard
                  key={row.id}
                  href={`/${lang}/finance/fees/fines/${fine.id}`}
                  eyebrow={fineTypeLabel(fine.fineType)}
                  title={fine.studentName}
                  value={formatCurrency(fine.amount, lang, currency || "USD")}
                  badges={
                    <Badge variant="outline" className={status.tone}>
                      {status.label}
                    </Badge>
                  }
                  meta={
                    fine.dueDate
                      ? formatDate(fine.dueDate, lang, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
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

export const FinesTable = React.memo(FinesTableInner)
