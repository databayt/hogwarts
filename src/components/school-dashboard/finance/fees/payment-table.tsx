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

import { fetchPaymentRows } from "./actions"
import { getPaymentColumns, type PaymentRow } from "./payment-columns"

interface PaymentsTableProps {
  initialData: PaymentRow[]
  total: number
  lang: Locale
  perPage?: number
}

function PaymentsTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: PaymentsTableProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  const { data, isLoading, hasMore, loadMore } = usePlatformData<
    PaymentRow,
    Record<string, unknown>
  >({
    initialData,
    total,
    perPage,
    fetcher: fetchPaymentRows,
  })

  const columns = useMemo(
    () => [getSelectColumn<PaymentRow>(), ...getPaymentColumns(lang)],
    [lang]
  )

  const { table } = useDataTable<PaymentRow>({
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
    router.push(`/${lang}/finance/fees/payments/new`)
  }, [router, lang])

  const handleBulkExport = useCallback(
    async (rows: PaymentRow[]) => {
      const header = "Payment #,Student,Amount,Method,Status"
      const csv = rows
        .map(
          (r) =>
            `${r.paymentNumber},${r.studentName},${r.amount},${r.paymentMethod},${r.status}`
        )
        .join("\n")
      const csvContent = `${header}\n${csv}`

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "payments.csv"
      link.click()
      table.toggleAllPageRowsSelected(false)
    },
    [table]
  )

  const bulkActions = useMemo(
    () => [createExportAction<PaymentRow>(handleBulkExport, lang)],
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
        searchPlaceholder="Search payments..."
        onCreate={handleCreate}
        entityName="payments"
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

export const PaymentsTable = React.memo(PaymentsTableInner)
