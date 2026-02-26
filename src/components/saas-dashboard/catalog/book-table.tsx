"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"

import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { catalogBookColumns, type CatalogBookRow } from "./book-columns"

interface Props {
  data: CatalogBookRow[]
}

export function CatalogBookTable({ data }: Props) {
  const columns = useMemo(() => catalogBookColumns, [])

  const { table } = useDataTable<CatalogBookRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 50 },
    },
  })

  return <DataTable table={table} />
}
