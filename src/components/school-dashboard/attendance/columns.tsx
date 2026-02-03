"use client"

import { ColumnDef } from "@tanstack/react-table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { AttendanceRow } from "./table"

export const getAttendanceColumns = (
  dictionary?: Dictionary["school"]["attendance"]
): ColumnDef<AttendanceRow>[] => {
  const dict = dictionary || {
    title: "Attendance",
    present: "Present",
    absent: "Absent",
    late: "Late",
    holiday: "Holiday",
    excused: "Excused",
  }

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue, row, column, table }) => {
        const v = getValue<"present" | "absent" | "late">()
        return (
          <Select
            value={v}
            onValueChange={(val) => {
              row.toggleSelected(true)
              ;(
                table.options as unknown as {
                  meta?: {
                    onChangeStatus?: (
                      id: string,
                      status: "present" | "absent" | "late"
                    ) => void
                  }
                }
              )?.meta?.onChangeStatus?.(
                row.original.studentId,
                val as "present" | "absent" | "late"
              )
            }}
          >
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">
                {dict.present || "Present"}
              </SelectItem>
              <SelectItem value="absent">{dict.absent || "Absent"}</SelectItem>
              <SelectItem value="late">{dict.late || "Late"}</SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getAttendanceColumns()
// inside useMemo in client components to avoid SSR hook issues.
