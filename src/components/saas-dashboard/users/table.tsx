"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useDeferredValue, useMemo, useState } from "react"
import { Users } from "lucide-react"

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

import type { UserRow } from "./actions"
import { fetchUsers } from "./actions"
import { getUserColumns } from "./columns"

interface UsersTableProps {
  initialData: UserRow[]
  total: number
  perPage?: number
}

export function UsersTable({
  initialData,
  total,
  perPage = 20,
}: UsersTableProps) {
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

  // Data management with optimistic updates
  const { data, isLoading, hasMore, loadMore, optimisticRemove } =
    usePlatformData<UserRow, Record<string, unknown>>({
      initialData,
      total,
      perPage,
      fetcher: async (params) => {
        const result = await fetchUsers({
          page: params.page,
          perPage: params.perPage,
          search: (deferredSearch as string) || undefined,
        })
        return {
          rows: result.data,
          total: result.total,
        }
      },
      filters,
    })

  // Handle delete - called after dialog confirms and server action succeeds
  const handleDelete = useCallback(
    (user: UserRow) => {
      optimisticRemove(user.id)
    },
    [optimisticRemove]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getUserColumns({
        onDelete: handleDelete,
      }),
    [handleDelete]
  )

  // Table instance
  const { table } = useDataTable<UserRow>({
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
        username: false,
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
        searchPlaceholder="Search users..."
        entityName="users"
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title="No users found"
              description="Users will appear here once they register on the platform."
              icon={<Users className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((user) => (
                <GridCard
                  key={user.id}
                  title={user.email || "No email"}
                  description={user.role}
                  subtitle={user.schoolName || "No school"}
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
