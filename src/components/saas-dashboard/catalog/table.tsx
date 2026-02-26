"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"

import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { catalogColumns, type CatalogSubjectRow } from "./columns"

interface Props {
  data: CatalogSubjectRow[]
}

export function CatalogTable({ data }: Props) {
  const columns = useMemo(() => catalogColumns, [])

  const { table } = useDataTable<CatalogSubjectRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 50 },
    },
  })

  return <DataTable table={table} />
}
