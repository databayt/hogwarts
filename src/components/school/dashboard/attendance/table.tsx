"use client";

import * as React from 'react'
import { DataTable } from '@/components/table/data-table/data-table'
import { DataTableToolbar } from '@/components/table/data-table/data-table-toolbar'
import { useDataTable } from '@/components/table/hooks/use-data-table'
import { ColumnDef } from '@tanstack/react-table'

export type AttendanceRow = { studentId: string; name: string; status: 'present' | 'absent' | 'late' }

export function AttendanceTable({ data, columns, onChangeStatus }: { data: AttendanceRow[]; columns: ColumnDef<AttendanceRow, unknown>[]; onChangeStatus?: (studentId: string, status: AttendanceRow['status']) => void }) {
  const { table } = useDataTable<AttendanceRow>({ data, columns, pageCount: -1 })
  (table.options as unknown as { meta?: Record<string, unknown> }).meta = {
    ...((table.options as unknown as { meta?: Record<string, unknown> }).meta ?? {}),
    onChangeStatus,
  }
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  )
}



