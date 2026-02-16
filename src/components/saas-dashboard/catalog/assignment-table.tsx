"use client"

import { useMemo } from "react"

import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import {
  assignmentColumns,
  type CatalogAssignmentRow,
} from "./assignment-columns"

interface Props {
  data: CatalogAssignmentRow[]
}

export function AssignmentTable({ data }: Props) {
  const columns = useMemo(() => assignmentColumns, [])

  const { table } = useDataTable<CatalogAssignmentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 50 },
    },
  })

  return <DataTable table={table} />
}
