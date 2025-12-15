"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Clock, Ellipsis } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModal } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { PeriodRow } from "./types"

export interface PeriodColumnCallbacks {
  onDelete?: (row: PeriodRow) => void
}

export const getPeriodColumns = (
  lang?: Locale,
  callbacks?: PeriodColumnCallbacks
): ColumnDef<PeriodRow>[] => {
  const t = {
    name: lang === "ar" ? "اسم الحصة" : "Period Name",
    academicYear: lang === "ar" ? "العام الدراسي" : "Academic Year",
    startTime: lang === "ar" ? "وقت البداية" : "Start Time",
    endTime: lang === "ar" ? "وقت النهاية" : "End Time",
    duration: lang === "ar" ? "المدة" : "Duration",
    created: lang === "ar" ? "تاريخ الإنشاء" : "Created",
    actions: lang === "ar" ? "إجراءات" : "Actions",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
    minutes: lang === "ar" ? "دقيقة" : "min",
  }

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      meta: { label: t.name, variant: "text" },
      id: "name",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return (
          <span className="flex items-center gap-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <span className="font-medium">{value}</span>
          </span>
        )
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "yearName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.academicYear} />
      ),
      meta: { label: t.academicYear, variant: "text" },
      id: "yearName",
      enableColumnFilter: true,
    },
    {
      accessorKey: "startTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.startTime} />
      ),
      meta: { label: t.startTime, variant: "text" },
      id: "startTime",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return <span className="font-mono text-sm tabular-nums">{value}</span>
      },
    },
    {
      accessorKey: "endTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.endTime} />
      ),
      meta: { label: t.endTime, variant: "text" },
      id: "endTime",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return <span className="font-mono text-sm tabular-nums">{value}</span>
      },
    },
    {
      id: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.duration} />
      ),
      meta: { label: t.duration, variant: "number" },
      cell: ({ row }) => {
        const start = row.original.startTime.split(":").map(Number)
        const end = row.original.endTime.split(":").map(Number)
        const startMinutes = start[0] * 60 + start[1]
        const endMinutes = end[0] * 60 + end[1]
        const duration = endMinutes - startMinutes
        return (
          <span className="text-muted-foreground text-sm tabular-nums">
            {duration} {t.minutes}
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      meta: { label: t.created, variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const periodItem = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(periodItem.id)

        const onDelete = () => {
          callbacks?.onDelete?.(periodItem)
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
