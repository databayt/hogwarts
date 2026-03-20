"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useDeferredValue, useMemo, useState } from "react"
import { Building2 } from "lucide-react"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { fetchTenants } from "./actions"
import { getTenantColumns, type TenantRow } from "./columns"

interface TenantsTableProps {
  initialData: TenantRow[]
  total: number
  perPage?: number
}

export function TenantsTable({
  initialData,
  total,
  perPage = 10,
}: TenantsTableProps) {
  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  // Search state with debouncing
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  // Build filters object
  const filters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (deferredSearch) f.search = deferredSearch
    return f
  }, [deferredSearch])

  // Disable sensitive actions when impersonating
  const [impersonating, setImpersonating] = React.useState(false)
  React.useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("impersonate_schoolId="))
    setImpersonating(!!cookie)
  }, [])

  // Data management with optimistic updates
  const { data, isLoading, hasMore, loadMore, optimisticRemove } =
    usePlatformData<TenantRow, Record<string, unknown>>({
      initialData,
      total,
      perPage,
      fetcher: async (params) => {
        const result = await fetchTenants({
          page: params.page,
          perPage: params.perPage,
          search: (deferredSearch as string) || undefined,
        })
        return {
          rows: result.data as TenantRow[],
          total: result.total,
        }
      },
      filters,
    })

  // Handle delete - called after dialog confirms and server action succeeds
  const handleDelete = useCallback(
    (tenant: TenantRow) => {
      optimisticRemove(tenant.id)
    },
    [optimisticRemove]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getTenantColumns({
        onDelete: handleDelete,
      }),
    [handleDelete]
  )

  // Table instance
  const { table } = useDataTable<TenantRow>({
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
        trialEndsAt: false,
        catalog: false,
      },
    },
  })

  // Handle search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search schools..."
        entityName="tenants"
        additionalActions={
          impersonating ? (
            <span className="text-xs text-amber-600">
              Impersonation active — actions disabled
            </span>
          ) : undefined
        }
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          getRowClassName={(row) =>
            row.domain === "demo" ? "opacity-50 pointer-events-none" : undefined
          }
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title="No schools found"
              description="Schools will appear here once they complete onboarding."
              icon={<Building2 className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((tenant) => (
                <GridCard
                  key={tenant.id}
                  title={tenant.name}
                  description={`${tenant.subdomain}.databayt.org`}
                  subtitle={`${tenant.studentCount} students, ${tenant.teacherCount} teachers`}
                />
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
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
