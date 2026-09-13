"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"

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

import { deleteScholarship, fetchScholarshipRows } from "./actions"
import { STATUS_COLORS } from "./config"
import {
  getScholarshipColumns,
  type ScholarshipRow,
} from "./scholarship-columns"

interface ScholarshipsTableProps {
  initialData: ScholarshipRow[]
  total: number
  lang: Locale
  perPage?: number
  /** The school's currency — `School.currency`, never a default. */
  currency?: string
}

function ScholarshipsTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
  currency,
}: ScholarshipsTableProps) {
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
  const sf = (dictionary as any)?.finance?.scholarshipForm as
    | Record<string, string>
    | undefined
  // `coverageAmount` is a percentage for PERCENTAGE awards and money only for
  // FIXED_AMOUNT ones; a FULL award covers everything and has no figure.
  const coverage = (s: ScholarshipRow) =>
    s.coverageType === "PERCENTAGE"
      ? `${new Intl.NumberFormat(lang).format(s.coverageAmount)}%`
      : s.coverageType === "FULL"
        ? sf?.full
        : formatCurrency(s.coverageAmount, lang, currency || "USD")

  const { data, isLoading, hasMore, loadMore, refresh, optimisticRemove } =
    usePlatformData<ScholarshipRow, Record<string, unknown>>({
      initialData,
      total,
      perPage,
      fetcher: fetchScholarshipRows,
      filters: debouncedSearch ? { search: debouncedSearch } : undefined,
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
      getSelectColumn<ScholarshipRow>(),
      ...getScholarshipColumns(
        lang,
        col,
        { onDelete: handleSingleDelete },
        currency
      ),
    ],
    [lang, col, handleSingleDelete, currency]
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

  // NOTE: no router.refresh() here — usePlatformData's filter-change effect
  // already refetches, and refreshing the whole route per keystroke re-ran the
  // entire server component tree for a result that never changed.
  const handleSearchChange = setSearchValue

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
        phoneView={phoneView}
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
              const scholarship = row.original
              return (
                <ItemCard
                  key={row.id}
                  href={`/${lang}/finance/fees/scholarships/${scholarship.id}`}
                  eyebrow={scholarship.academicYear}
                  title={scholarship.name}
                  value={coverage(scholarship)}
                  badges={
                    <Badge
                      variant="outline"
                      className={
                        scholarship.isActive
                          ? STATUS_COLORS.ACTIVE
                          : STATUS_COLORS.INACTIVE
                      }
                    >
                      {scholarship.isActive ? col?.active : col?.inactive}
                    </Badge>
                  }
                  meta={
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" aria-hidden="true" />
                      {scholarship.maxBeneficiaries !== null
                        ? `${scholarship.currentBeneficiaries} / ${scholarship.maxBeneficiaries}`
                        : scholarship.currentBeneficiaries}
                    </span>
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

export const ScholarshipsTable = React.memo(ScholarshipsTableInner)
