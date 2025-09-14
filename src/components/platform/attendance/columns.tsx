"use client";

import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/table/data-table/data-table-column-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Dictionary } from '@/components/internationalization/dictionaries'

import type { AttendanceRow } from './table'

export const getAttendanceColumns = (dictionary?: Dictionary['school']['attendance']): ColumnDef<AttendanceRow>[] => {
  const dict = dictionary || {
    student: "Student",
    status: {
      title: "Status",
      present: "Present",
      absent: "Absent",
      late: "Late"
    }
  }

  return [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title={dict.student} />,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title={dict.status.title} />,
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
            <SelectItem value="present">{dict.status.present}</SelectItem>
            <SelectItem value="absent">{dict.status.absent}</SelectItem>
            <SelectItem value="late">{dict.status.late}</SelectItem>
          </SelectContent>
        </Select>
      )
    },
  },
  ]
}

// Export a default version for backward compatibility
export const attendanceColumns = getAttendanceColumns()



