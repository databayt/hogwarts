"use client"

import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { InvoiceCreateForm } from "@/components/school-dashboard/finance/invoice/form"
import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteInvoice, getInvoicesWithFilters } from "./actions"
import { getInvoiceColumns, type InvoiceRow } from "./columns"

interface InvoiceTableProps {
  initialData: InvoiceRow[]
  total: number
  perPage?: number
  lang?: Locale
}

function InvoiceTableInner({
  initialData,
  total,
  perPage = 20,
  lang = "en",
}: InvoiceTableProps) {
  const router = useRouter()

  // State for incremental loading
  const [data, setData] = useState<InvoiceRow[]>(initialData)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Refresh function for Modal callback
  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const hasMore = data.length < total

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (invoice: InvoiceRow) => {
      try {
        const ok = await confirmDeleteDialog(
          `Delete invoice ${invoice.invoice_no}?`
        )
        if (!ok) return

        // Optimistic remove
        setData((prev) => prev.filter((i) => i.id !== invoice.id))

        const result = await deleteInvoice({ id: invoice.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast("Failed to delete invoice")
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : "Failed to delete")
      }
    },
    [refresh]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getInvoiceColumns(lang, {
        onDelete: handleDelete,
      }),
    [lang, handleDelete]
  )

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const result = await getInvoicesWithFilters({ page: nextPage, perPage })

      if (result.success && result.data.length > 0) {
        setData((prev) => [...prev, ...result.data])
        setCurrentPage(nextPage)
      }
    } catch (error) {
      console.error("Failed to load more invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, perPage, isLoading, hasMore])

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<InvoiceRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length, // Show all loaded data
      },
    },
  })

  const { openModal } = useModal()

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
    >
      <DataTableToolbar table={table}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-full p-0"
          onClick={() => openModal()}
          aria-label="Create Invoice"
          title="Create Invoice"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DataTableToolbar>
      <Modal content={<InvoiceCreateForm onSuccess={refresh} />} />
    </DataTable>
  )
}

export const InvoiceTable = React.memo(InvoiceTableInner)
