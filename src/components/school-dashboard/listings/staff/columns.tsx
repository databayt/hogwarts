"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { getEmploymentStatusColor, getEmploymentTypeColor } from "./config"
import { type StaffRow } from "./types"

export type StaffColumnActions = {
  onView?: (staff: StaffRow) => void
  onEdit?: (staff: StaffRow) => void
  onDelete?: (staff: StaffRow) => void
}

export function getStaffColumns(
  actions?: StaffColumnActions,
  lang?: string
): ColumnDef<StaffRow>[] {
  const isAr = lang === "ar"

  const t = {
    name: isAr ? "الاسم" : "Name",
    position: isAr ? "المنصب" : "Position",
    department: isAr ? "القسم" : "Department",
    status: isAr ? "الحالة" : "Status",
    type: isAr ? "النوع" : "Type",
    account: isAr ? "الحساب" : "Account",
    active: isAr ? "نشط" : "Active",
    noAccount: isAr ? "بدون حساب" : "No Account",
    actions: isAr ? "إجراءات" : "Actions",
    view: isAr ? "عرض" : "View",
    edit: isAr ? "تعديل" : "Edit",
    delete: isAr ? "حذف" : "Delete",
    selectAll: isAr ? "تحديد الكل" : "Select all",
    selectRow: isAr ? "تحديد الصف" : "Select row",
    openMenu: isAr ? "فتح القائمة" : "Open menu",
  }

  const statusLabels: Record<string, string> = isAr
    ? {
        ACTIVE: "نشط",
        ON_LEAVE: "في إجازة",
        TERMINATED: "منتهي",
        RETIRED: "متقاعد",
      }
    : {
        ACTIVE: "Active",
        ON_LEAVE: "On Leave",
        TERMINATED: "Terminated",
        RETIRED: "Retired",
      }

  const typeLabels: Record<string, string> = isAr
    ? {
        FULL_TIME: "دوام كامل",
        PART_TIME: "دوام جزئي",
        CONTRACT: "عقد",
        TEMPORARY: "مؤقت",
      }
    : {
        FULL_TIME: "Full Time",
        PART_TIME: "Part Time",
        CONTRACT: "Contract",
        TEMPORARY: "Temporary",
      }

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t.selectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t.selectRow}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      cell: ({ row }) => {
        const staff = row.original
        const locale = lang || "en"
        return (
          <div className="flex flex-col">
            {staff.userId ? (
              <Link
                href={`/${locale}/profile/${staff.userId}`}
                className="font-medium hover:underline"
              >
                {staff.name}
              </Link>
            ) : (
              <span className="font-medium">{staff.name}</span>
            )}
            <span className="text-muted-foreground text-sm">
              {staff.emailAddress}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "position",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.position} />
      ),
      cell: ({ row }) => {
        return <span>{row.getValue("position") || "-"}</span>
      },
    },
    {
      accessorKey: "departmentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.department} />
      ),
      cell: ({ row }) => {
        return <span>{row.getValue("departmentName") || "-"}</span>
      },
    },
    {
      accessorKey: "employmentStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ row }) => {
        const status = row.getValue("employmentStatus") as string
        const color = getEmploymentStatusColor(status)
        return (
          <Badge
            variant="outline"
            className={`border-${color}-500 text-${color}-500`}
          >
            {statusLabels[status] || status}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "employmentType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.type} />
      ),
      cell: ({ row }) => {
        const type = row.getValue("employmentType") as string
        const color = getEmploymentTypeColor(type)
        return (
          <Badge
            variant="secondary"
            className={`bg-${color}-100 text-${color}-700`}
          >
            {typeLabels[type] || type.replace("_", " ")}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.account} />
      ),
      cell: ({ row }) => {
        const hasAccount = row.original.userId !== null
        return (
          <Badge variant={hasAccount ? "default" : "secondary"}>
            {hasAccount ? t.active : t.noAccount}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const staff = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t.openMenu}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"}>
              {actions?.onView && (
                <DropdownMenuItem onClick={() => actions.onView?.(staff)}>
                  {t.view}
                </DropdownMenuItem>
              )}
              {actions?.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit?.(staff)}>
                  {t.edit}
                </DropdownMenuItem>
              )}
              {actions?.onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => actions.onDelete?.(staff)}
                  >
                    {t.delete}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
