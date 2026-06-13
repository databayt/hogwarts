"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useDeferredValue, useMemo, useState } from "react"
import Image from "next/image"

import { asset } from "@/lib/asset-url"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import type { Locale } from "@/components/internationalization/config"
import {
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { getInquiries, getTourBookings } from "./leads-actions"
import {
  getInquiryColumns,
  getTourBookingColumns,
  type InquiryRow,
  type LeadsAdmissionDict,
  type TourBookingRow,
} from "./leads-columns"

// ============================================================================
// Inquiries table
// ============================================================================

interface InquiriesTableProps {
  initialData: InquiryRow[]
  total: number
  dictionary: LeadsAdmissionDict
  lang: Locale
  perPage?: number
}

export function InquiriesTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: InquiriesTableProps) {
  const t = dictionary
  const { view, toggleView } = usePlatformView({ defaultView: "table" })
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  const filters = useMemo(
    () => (deferredSearch ? { search: deferredSearch } : {}),
    [deferredSearch]
  )

  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
  } = usePlatformData<InquiryRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getInquiries({
        ...params,
        search: deferredSearch || undefined,
      })
      if (result.success && result.data) {
        return {
          rows: result.data.rows as InquiryRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters,
  })

  const columns = useMemo(() => getInquiryColumns(t, lang), [t, lang])

  const { table } = useDataTable<InquiryRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || perPage },
    },
  })

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  const leads = t?.leads
  const tb = t?.toolbar

  const toolbarTranslations = {
    search: leads?.searchInquiries || "Search inquiries...",
    create: "",
    reset: tb?.reset || "Reset",
    tableView: tb?.tableView || "Table",
    gridView: tb?.gridView || "Grid",
    switchToTable: tb?.switchToTable || "Switch to table view",
    switchToGrid: tb?.switchToGrid || "Switch to grid view",
    export: leads?.export || "Export",
    exportCSV: tb?.exportCSV || "Export CSV",
    exporting: tb?.exporting || "Exporting...",
    view: tb?.view || "View",
    searchColumns: tb?.searchColumns || "Search columns...",
    noColumns: tb?.noColumns || "No columns found.",
    all: tb?.all || "All",
  }

  const dataTableTranslations = {
    noResults: tb?.noResults || "No results.",
    loadMore: tb?.loadMore || "Load More",
    loading: tb?.loading || "Loading...",
  }

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={leads?.searchInquiries || "Search inquiries..."}
        entityName="inquiries"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          translations={dataTableTranslations}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={leads?.noInquiries || "No inquiries yet"}
              description={
                leads?.noInquiriesDescription ||
                "Inquiries submitted via the public portal will appear here"
              }
              icon={
                <Image
                  src={asset("/icons/document.svg")}
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="space-y-1 rounded-lg border p-4 text-sm"
                >
                  <div className="font-medium">{inquiry.parentName}</div>
                  <div className="text-muted-foreground">{inquiry.email}</div>
                  <div className="text-muted-foreground">
                    {inquiry.interestedGrade ?? "-"}
                  </div>
                </div>
              ))}
            </GridContainer>
          )}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isLoading
                  ? tb?.loading || "Loading..."
                  : tb?.loadMore || "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

// ============================================================================
// Tour bookings table
// ============================================================================

interface TourBookingsTableProps {
  initialData: TourBookingRow[]
  total: number
  dictionary: LeadsAdmissionDict
  lang: Locale
  perPage?: number
}

export function TourBookingsTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: TourBookingsTableProps) {
  const t = dictionary
  const { view, toggleView } = usePlatformView({ defaultView: "table" })
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  const filters = useMemo(
    () => (deferredSearch ? { search: deferredSearch } : {}),
    [deferredSearch]
  )

  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
  } = usePlatformData<TourBookingRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getTourBookings({
        ...params,
        search: deferredSearch || undefined,
      })
      if (result.success && result.data) {
        return {
          rows: result.data.rows as TourBookingRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters,
  })

  const columns = useMemo(() => getTourBookingColumns(t, lang), [t, lang])

  const { table } = useDataTable<TourBookingRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || perPage },
    },
  })

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  const leads = t?.leads
  const tb = t?.toolbar

  const toolbarTranslations = {
    search: leads?.searchTours || "Search tour bookings...",
    create: "",
    reset: tb?.reset || "Reset",
    tableView: tb?.tableView || "Table",
    gridView: tb?.gridView || "Grid",
    switchToTable: tb?.switchToTable || "Switch to table view",
    switchToGrid: tb?.switchToGrid || "Switch to grid view",
    export: leads?.export || "Export",
    exportCSV: tb?.exportCSV || "Export CSV",
    exporting: tb?.exporting || "Exporting...",
    view: tb?.view || "View",
    searchColumns: tb?.searchColumns || "Search columns...",
    noColumns: tb?.noColumns || "No columns found.",
    all: tb?.all || "All",
  }

  const dataTableTranslations = {
    noResults: tb?.noResults || "No results.",
    loadMore: tb?.loadMore || "Load More",
    loading: tb?.loading || "Loading...",
  }

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={leads?.searchTours || "Search tour bookings..."}
        entityName="tours"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          translations={dataTableTranslations}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={leads?.noTourBookings || "No tour bookings yet"}
              description={
                leads?.noTourBookingsDescription ||
                "Tour bookings from the portal will appear here"
              }
              icon={
                <Image
                  src={asset("/icons/document.svg")}
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((booking) => (
                <div
                  key={booking.id}
                  className="space-y-1 rounded-lg border p-4 text-sm"
                >
                  <div className="font-medium">{booking.parentName}</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {booking.bookingNumber}
                  </div>
                  <div className="text-muted-foreground">
                    {booking.slotDate
                      ? new Date(booking.slotDate).toLocaleDateString(lang)
                      : "-"}
                  </div>
                </div>
              ))}
            </GridContainer>
          )}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isLoading
                  ? tb?.loading || "Loading..."
                  : tb?.loadMore || "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
