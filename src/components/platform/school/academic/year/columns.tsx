"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"
import { Button } from "@/components/ui/button"
import { Ellipsis, Calendar, Layers } from "lucide-react"
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
import type { SchoolYearRow } from "./types"

export interface SchoolYearColumnCallbacks {
  onDelete?: (row: SchoolYearRow) => void
}

export const getSchoolYearColumns = (
  lang?: Locale,
  callbacks?: SchoolYearColumnCallbacks
): ColumnDef<SchoolYearRow>[] => {
  const t = {
    yearName: lang === "ar" ? "اسم العام الدراسي" : "Academic Year",
    startDate: lang === "ar" ? "تاريخ البداية" : "Start Date",
    endDate: lang === "ar" ? "تاريخ النهاية" : "End Date",
    terms: lang === "ar" ? "الفصول" : "Terms",
    periods: lang === "ar" ? "الحصص" : "Periods",
    created: lang === "ar" ? "تاريخ الإنشاء" : "Created",
    actions: lang === "ar" ? "إجراءات" : "Actions",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
  }

  return [
    {
      accessorKey: "yearName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.yearName} />
      ),
      meta: { label: t.yearName, variant: "text" },
      id: "yearName",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return (
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{value}</span>
          </span>
        )
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.startDate} />
      ),
      meta: { label: t.startDate, variant: "text" },
      id: "startDate",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return (
          <span className="text-sm tabular-nums">
            {new Date(value).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            )}
          </span>
        )
      },
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.endDate} />
      ),
      meta: { label: t.endDate, variant: "text" },
      id: "endDate",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return (
          <span className="text-sm tabular-nums">
            {new Date(value).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            )}
          </span>
        )
      },
    },
    {
      accessorKey: "_count.terms",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.terms} />
      ),
      meta: { label: t.terms, variant: "number" },
      id: "terms",
      cell: ({ row }) => {
        const count = row.original._count?.terms ?? 0
        return (
          <span className="flex items-center gap-1 text-sm tabular-nums">
            <Layers className="h-3 w-3 text-muted-foreground" />
            {count}
          </span>
        )
      },
    },
    {
      accessorKey: "_count.periods",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.periods} />
      ),
      meta: { label: t.periods, variant: "number" },
      id: "periods",
      cell: ({ row }) => {
        const count = row.original._count?.periods ?? 0
        return <span className="text-sm tabular-nums">{count}</span>
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      meta: { label: t.created, variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums text-muted-foreground">
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
        const yearItem = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(yearItem.id)

        const onDelete = () => {
          callbacks?.onDelete?.(yearItem)
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
