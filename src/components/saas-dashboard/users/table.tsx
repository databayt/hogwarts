"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { useDataTable } from "@/components/table/use-data-table"

import { fetchUsers } from "./actions"

interface UsersTableProps<TData> {
  initialData: TData[]
  columns: ColumnDef<TData, unknown>[]
  total: number
  perPage?: number
}

export function UsersTable<TData>({
  initialData,
  columns,
  total,
  perPage = 20,
}: UsersTableProps<TData>) {
  const [data, setData] = React.useState<TData[]>(initialData)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)

  const hasMore = data.length < total

  const handleLoadMore = React.useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const result = await fetchUsers({ page: nextPage, perPage })

      if (result.data.length > 0) {
        setData((prev) => [...prev, ...(result.data as TData[])])
        setCurrentPage(nextPage)
      }
    } catch (error) {
      console.error("Failed to load more users:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, perPage, isLoading, hasMore])

  const { table } = useDataTable<TData>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length,
      },
    },
  })

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
    >
      <DataTableToolbar table={table} />
    </DataTable>
  )
}
