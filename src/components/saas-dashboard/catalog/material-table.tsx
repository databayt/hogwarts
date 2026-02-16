"use client"

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
