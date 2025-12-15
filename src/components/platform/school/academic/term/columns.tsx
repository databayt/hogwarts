"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Calendar, CheckCircle, Ellipsis } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

import type { TermRow } from "./types"

export interface TermColumnCallbacks {
  onDelete?: (row: TermRow) => void
  onSetActive?: (row: TermRow) => void
}

export const getTermColumns = (
  lang?: Locale,
  callbacks?: TermColumnCallbacks
): ColumnDef<TermRow>[] => {
  const t = {
    term: lang === "ar" ? "الفصل الدراسي" : "Term",
    academicYear: lang === "ar" ? "العام الدراسي" : "Academic Year",
    startDate: lang === "ar" ? "تاريخ البداية" : "Start Date",
    endDate: lang === "ar" ? "تاريخ النهاية" : "End Date",
    status: lang === "ar" ? "الحالة" : "Status",
    active: lang === "ar" ? "نشط" : "Active",
    inactive: lang === "ar" ? "غير نشط" : "Inactive",
    created: lang === "ar" ? "تاريخ الإنشاء" : "Created",
    actions: lang === "ar" ? "إجراءات" : "Actions",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
    setActive: lang === "ar" ? "تعيين كنشط" : "Set as Active",
  }

  return [
    {
      accessorKey: "termName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.term} />
      ),
      meta: { label: t.term, variant: "text" },
      id: "termName",
      cell: ({ row }) => {
        const termNumber = row.original.termNumber
        const isActive = row.original.isActive
        return (
          <span className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span className="font-medium">
              {lang === "ar" ? `الفصل ${termNumber}` : `Term ${termNumber}`}
            </span>
            {isActive && <CheckCircle className="h-4 w-4 text-green-500" />}
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
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      meta: { label: t.status, variant: "text" },
      id: "isActive",
      cell: ({ getValue }) => {
        const isActive = getValue<boolean>()
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? t.active : t.inactive}
          </Badge>
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
        const termItem = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(termItem.id)

        const onDelete = () => {
          callbacks?.onDelete?.(termItem)
        }

        const onSetActive = () => {
          callbacks?.onSetActive?.(termItem)
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
              {!termItem.isActive && (
                <DropdownMenuItem onClick={onSetActive}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t.setActive}
                </DropdownMenuItem>
              )}
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
