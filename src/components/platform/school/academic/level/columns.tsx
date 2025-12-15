"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"
import { Button } from "@/components/ui/button"
import { Ellipsis, GraduationCap, Users } from "lucide-react"
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
import type { YearLevelRow } from "./types"

export interface YearLevelColumnCallbacks {
  onDelete?: (row: YearLevelRow) => void
}

export const getYearLevelColumns = (
  lang?: Locale,
  callbacks?: YearLevelColumnCallbacks
): ColumnDef<YearLevelRow>[] => {
  const t = {
    levelName: lang === "ar" ? "اسم المرحلة" : "Level Name",
    levelNameAr: lang === "ar" ? "الاسم بالعربية" : "Arabic Name",
    order: lang === "ar" ? "الترتيب" : "Order",
    batches: lang === "ar" ? "الدفعات" : "Batches",
    students: lang === "ar" ? "الطلاب" : "Students",
    created: lang === "ar" ? "تاريخ الإنشاء" : "Created",
    actions: lang === "ar" ? "إجراءات" : "Actions",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
  }

  return [
    {
      accessorKey: "levelOrder",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.order} />
      ),
      meta: { label: t.order, variant: "number" },
      id: "levelOrder",
      cell: ({ getValue }) => {
        const value = getValue<number>()
        return (
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
            {value}
          </span>
        )
      },
    },
    {
      accessorKey: "levelName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.levelName} />
      ),
      meta: { label: t.levelName, variant: "text" },
      id: "levelName",
      cell: ({ row }) => {
        const name = lang === "ar" && row.original.levelNameAr
          ? row.original.levelNameAr
          : row.original.levelName
        return (
          <span className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{name}</span>
          </span>
        )
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "levelNameAr",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.levelNameAr} />
      ),
      meta: { label: t.levelNameAr, variant: "text" },
      id: "levelNameAr",
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? (
          <span className="text-sm" dir="rtl">{value}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "_count.batches",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.batches} />
      ),
      meta: { label: t.batches, variant: "number" },
      id: "batches",
      cell: ({ row }) => {
        const count = row.original._count?.batches ?? 0
        return <span className="text-sm tabular-nums">{count}</span>
      },
    },
    {
      accessorKey: "_count.studentYearLevels",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.students} />
      ),
      meta: { label: t.students, variant: "number" },
      id: "students",
      cell: ({ row }) => {
        const count = row.original._count?.studentYearLevels ?? 0
        return (
          <span className="flex items-center gap-1 text-sm tabular-nums">
            <Users className="h-3 w-3 text-muted-foreground" />
            {count}
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
        const levelItem = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(levelItem.id)

        const onDelete = () => {
          callbacks?.onDelete?.(levelItem)
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
