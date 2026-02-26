"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"

import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { materialColumns, type CatalogMaterialRow } from "./material-columns"

interface Props {
  data: CatalogMaterialRow[]
}

export function MaterialTable({ data }: Props) {
  const columns = useMemo(() => materialColumns, [])

  const { table } = useDataTable<CatalogMaterialRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 50 },
    },
  })

  return <DataTable table={table} />
}
