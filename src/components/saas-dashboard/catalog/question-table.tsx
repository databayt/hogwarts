"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"

import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { questionColumns, type CatalogQuestionRow } from "./question-columns"

interface Props {
  data: CatalogQuestionRow[]
}

export function QuestionTable({ data }: Props) {
  const columns = useMemo(() => questionColumns, [])

  const { table } = useDataTable<CatalogQuestionRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 50 },
    },
  })

  return <DataTable table={table} />
}
