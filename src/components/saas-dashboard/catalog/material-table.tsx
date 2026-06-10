"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { getMaterialColumns, type MaterialRow } from "./material-columns"

interface Props {
  data: MaterialRow[]
  dictionary?: Dictionary
}

export function MaterialTable({ data, dictionary }: Props) {
  const columns = useMemo(() => getMaterialColumns(dictionary), [dictionary])

  const { table } = useDataTable<MaterialRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 50 },
    },
  })

  return <DataTable table={table} />
}
