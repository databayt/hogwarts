"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { useDataTable } from "@/components/table/use-data-table"

export function AuditLogTable<TData>({
  data,
  columns,
}: {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
}) {
  const [tableData, setTableData] = React.useState<TData[]>(data)
  React.useEffect(() => setTableData(data), [data])

  const { table } = useDataTable<TData>({
    data: tableData,
    columns,
    pageCount: -1,
  })

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  )
}
