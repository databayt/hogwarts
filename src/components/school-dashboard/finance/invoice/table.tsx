"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"
import type { Column } from "@tanstack/react-table"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import { Toolbar, ToolbarGroup } from "@/components/atom/toolbar"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { createDraftInvoice } from "@/components/school-dashboard/finance/invoice/wizard/actions"
import { DataTable } from "@/components/table/data-table"
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter"
import { DataTableViewOptions } from "@/components/table/data-table-view-options"
import { useDataTable } from "@/components/table/use-data-table"
import { useDebouncedCallback } from "@/components/table/use-debounced-callback"

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
  const { dictionary } = useDictionary()
  const fd = (dictionary as any)?.finance
  const il = fd?.invoiceList as Record<string, string> | undefined
  const ic = fd?.invoiceColumns as Record<string, string> | undefined

  // State for incremental loading
  const [data, setData] = useState<InvoiceRow[]>(initialData)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  // total is server-driven and changes as filters narrow/widen the result set —
  // the `total` prop only ever reflects the server's initial unfiltered render.
  const [totalCount, setTotalCount] = useState(total)

  // Refresh function for Modal callback
  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const hasMore = data.length < totalCount

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (invoice: InvoiceRow) => {
      try {
        const ok = await confirmDeleteDialog(
          `${il?.deleteInvoice || "Delete invoice"} ${invoice.invoice_no}?`
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
          ErrorToast(il?.failedToDelete || "Failed to delete invoice")
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : il?.failedToDeleteFallback || "Failed to delete"
        )
      }
    },
    [refresh]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getInvoiceColumns(
        lang,
        {
          onDelete: handleDelete,
        },
        ic
      ),
    [lang, handleDelete, ic]
  )

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

  // Resolve filterable columns once so the toolbar JSX stays declarative.
  const invoiceNoCol = table.getColumn("invoice_no")
  const clientCol = table.getColumn("client_name")
  const statusCol = table.getColumn("status")
  const isFiltered = table.getState().columnFilters.length > 0

  // `useDataTable` sets manualFiltering: true (see use-data-table.ts) because
  // invoices are server-paginated — getFilteredRowModel() intentionally returns
  // the UNFILTERED rows in that mode, so filtering must be done server-side.
  // getInvoicesWithFilters already supports invoice_no/client_name/status; we
  // just need to call it whenever these column filters change.
  const invoiceNoFilter = (invoiceNoCol?.getFilterValue() as string) ?? ""
  const clientNameFilter = (clientCol?.getFilterValue() as string) ?? ""
  const statusFilterValues = statusCol?.getFilterValue() as string[] | undefined
  const statusFilter = statusFilterValues?.[0] ?? ""

  const fetchFiltered = useCallback(
    async (filters: {
      invoice_no: string
      client_name: string
      status: string
    }) => {
      setIsLoading(true)
      try {
        const result = await getInvoicesWithFilters({
          page: 1,
          perPage,
          ...filters,
        })
        if (result.success) {
          setData(result.data)
          setCurrentPage(1)
          setTotalCount(result.total ?? 0)
        }
      } catch (error) {
        console.error("Failed to filter invoices:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [perPage]
  )

  const debouncedFetchFiltered = useDebouncedCallback(fetchFiltered, 300)

  // content.tsx already runs the initial filtered fetch server-side from the
  // URL's searchParams, so skip the redundant client fetch on mount and only
  // react to filters actually changing afterward.
  const isFirstFilterRun = useRef(true)
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false
      return
    }
    debouncedFetchFiltered({
      invoice_no: invoiceNoFilter,
      client_name: clientNameFilter,
      status: statusFilter,
    })
  }, [invoiceNoFilter, clientNameFilter, statusFilter, debouncedFetchFiltered])

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const result = await getInvoicesWithFilters({
        page: nextPage,
        perPage,
        invoice_no: invoiceNoFilter,
        client_name: clientNameFilter,
        status: statusFilter,
      })

      if (result.success && result.data.length > 0) {
        setData((prev) => [...prev, ...result.data])
        setCurrentPage(nextPage)
        if (typeof result.total === "number") setTotalCount(result.total)
      }
    } catch (error) {
      console.error("Failed to load more invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }, [
    currentPage,
    perPage,
    isLoading,
    hasMore,
    invoiceNoFilter,
    clientNameFilter,
    statusFilter,
  ])

  const handleCreate = useCallback(async () => {
    const result = await createDraftInvoice()
    if (result.success && result.data) {
      router.push(`/${lang}/finance/invoice/add/${result.data.id}/details`)
    }
  }, [router, lang])

  const onReset = useCallback(() => {
    table.resetColumnFilters()
  }, [table])

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
      translations={{
        loadMore: il?.loadMore,
        loading: il?.loading,
        noResults: il?.noInvoicesFound,
      }}
    >
      {/* Atom-based toolbar — start group holds filters, end group holds view + create */}
      <Toolbar className="p-1">
        <ToolbarGroup>
          {invoiceNoCol && (
            <TextFilterInput
              column={invoiceNoCol}
              placeholder={ic?.invoiceHash || "Invoice #"}
            />
          )}
          {clientCol && (
            <TextFilterInput
              column={clientCol}
              placeholder={ic?.client || "Client"}
            />
          )}
          {statusCol && (
            <DataTableFacetedFilter
              column={statusCol}
              title={ic?.status || "Status"}
              options={
                (
                  statusCol.columnDef.meta as {
                    options?: Array<{ label: string; value: string }>
                  }
                )?.options ?? []
              }
            />
          )}
          {isFiltered && (
            <Button
              aria-label={il?.reset || "Reset"}
              variant="outline"
              size="sm"
              className="h-9 border-dashed"
              onClick={onReset}
            >
              <X className="h-4 w-4" />
              {il?.reset || "Reset"}
            </Button>
          )}
        </ToolbarGroup>

        <ToolbarGroup position="end">
          <DataTableViewOptions
            table={table}
            translations={{
              view: ic?.view,
              searchColumns: il?.searchColumns,
              noColumns: il?.noColumns,
              all: il?.all,
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={handleCreate}
            aria-label={il?.createInvoice || "Create Invoice"}
            title={il?.createInvoice || "Create Invoice"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </ToolbarGroup>
      </Toolbar>
    </DataTable>
  )
}

export const InvoiceTable = React.memo(InvoiceTableInner)

// Local helper — keeps the text filter input markup in one place and at the
// platform-standard h-9. Mirrors the `text` variant rendering in
// `data-table-toolbar.tsx` without forcing this block back onto that component.
interface TextFilterInputProps<TData> {
  column: Column<TData, unknown>
  placeholder: string
}

function TextFilterInput<TData>({
  column,
  placeholder,
}: TextFilterInputProps<TData>) {
  return (
    <Input
      placeholder={placeholder}
      value={(column.getFilterValue() as string) ?? ""}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-9 w-40 lg:w-56"
    />
  )
}
