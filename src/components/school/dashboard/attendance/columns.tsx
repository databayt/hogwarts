"use client";

import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/table/data-table/data-table-column-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { AttendanceRow } from './table'

export const attendanceColumns: ColumnDef<AttendanceRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ getValue, row, column, table }) => {
      const v = getValue<'present' | 'absent' | 'late'>()
      return (
        <Select
          value={v}
          onValueChange={(val) => {
            row.toggleSelected(true)
            ;(table.options as unknown as { meta?: { onChangeStatus?: (id: string, status: 'present' | 'absent' | 'late') => void } })
              ?.meta?.onChangeStatus?.(row.original.studentId, val as 'present' | 'absent' | 'late')
          }}
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
      )
    },
  },
]



