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

import { deletePayment, fetchPaymentRows } from "./actions"
import { STATUS_COLORS } from "./config"
import { getPaymentColumns, type PaymentRow } from "./payment-columns"

interface PaymentsTableProps {
  initialData: PaymentRow[]
  total: number
  lang: Locale
  perPage?: number
  /** The school's currency — `School.currency`, never a default. */
  currency?: string
}

function PaymentsTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
  currency,
}: PaymentsTableProps) {
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
  const csvH = (dictionary as any)?.finance?.fees?.csvHeaders as
    | Record<string, string>
    | undefined
  const statusLabel = (status: string) =>
    ({
      PENDING: col?.pending,
      SUCCESS: col?.success,
      FAILED: col?.failed,
      CANCELLED: col?.cancelled,
      REFUNDED: col?.refunded,
    })[status] || status
  const methodLabel = (method: string) =>
    ({
      CASH: col?.cash,
      CHEQUE: col?.cheque,
      BANK_TRANSFER: col?.bankTransfer,
      CREDIT_CARD: col?.creditCard,
      DEBIT_CARD: col?.debitCard,
      UPI: col?.upi,
      NET_BANKING: col?.netBanking,
      WALLET: col?.wallet,
      OTHER: col?.other,
    })[method] || method.replace(/_/g, " ")

  const { data, isLoading, hasMore, loadMore } = usePlatformData<
    PaymentRow,
    { search?: string }
  >({
    initialData,
    total,
    perPage,
    fetcher: fetchPaymentRows,
    filters: debouncedSearch ? { search: debouncedSearch } : undefined,
  })

  const columns = useMemo(
    () => [
      getSelectColumn<PaymentRow>(),
      ...getPaymentColumns(lang, col, currency),
    ],
    [lang, col, currency]
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
    },
    [setSearchValue]
  )

  const handleCreate = useCallback(() => {
    router.push(`/${lang}/finance/fees/payments/new`)
  }, [router, lang])

  const handleBulkDelete = useCallback(
    async (rows: PaymentRow[]) => {
      const ok = await confirmDeleteDialog(`Delete ${rows.length} payment(s)?`)
      if (!ok) return

      const errors: string[] = []
      for (const row of rows) {
        const result = await deletePayment(row.id)
        if (!result.success) {
          errors.push(
            `${row.paymentNumber}: ${actionErrorMessage(result.error, dictionary, dictionary?.common?.failedToDelete || "Failed to delete")}`
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
    async (rows: PaymentRow[]) => {
      const header = [
        csvH?.paymentNumber || "Payment #",
        csvH?.student || "Student",
        csvH?.amount || "Amount",
        csvH?.method || "Method",
        csvH?.status || "Status",
      ].join(",")
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
    () => [
      createDeleteAction<PaymentRow>(handleBulkDelete, lang),
      createExportAction<PaymentRow>(handleBulkExport, lang),
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
          (dictionary as any)?.finance?.fees?.search?.payments ||
          "Search payments..."
        }
        onCreate={handleCreate}
        entityName="payments"
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
              const payment = row.original
              return (
                <ItemCard
                  key={row.id}
                  href={`/${lang}/finance/fees/payments/${payment.id}`}
                  eyebrow={payment.feeStructureName}
                  title={payment.studentName}
                  value={formatCurrency(
                    payment.amount,
                    lang,
                    currency || "USD"
                  )}
                  badges={
                    <>
                      <Badge
                        variant="outline"
                        className={
                          STATUS_COLORS[
                            payment.status as keyof typeof STATUS_COLORS
                          ]
                        }
                      >
                        {statusLabel(payment.status)}
                      </Badge>
                      <Badge variant="outline" className="bg-background">
                        {methodLabel(payment.paymentMethod)}
                      </Badge>
                    </>
                  }
                  meta={formatDate(payment.paymentDate, lang, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
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

export const PaymentsTable = React.memo(PaymentsTableInner)
