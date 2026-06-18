"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"

import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import {
  getEmploymentStatusColor,
  getEmploymentTypeColor,
  getStatusLabels,
  getTypeLabels,
} from "./config"
import { type StaffRow } from "./types"

export type StaffColumnActions = {
  onView?: (staff: StaffRow) => void
  onEdit?: (staff: StaffRow) => void
  onDelete?: (staff: StaffRow) => void
  onGenerateCredentials?: (
    staffId: string,
    staffName: string,
    badge?: string
  ) => void
  permissions?: UIPermissions
}

export function getStaffColumns(
  actions?: StaffColumnActions,
  lang?: string,
  staffDict?: Record<string, any>
): ColumnDef<StaffRow>[] {
  const isAr = lang === "ar"
  const permissions = actions?.permissions ?? FULL_UI_PERMISSIONS
  const col = staffDict?.columns as Record<string, string> | undefined

  const t = {
    name: col?.name || "Name",
    position: col?.position || "Position",
    department: col?.department || "Department",
    status: col?.status || "Status",
    type: col?.type || "Type",
    account: col?.account || "Account",
    active: col?.active || "Active",
    noAccount: col?.noAccount || "No Account",
    actions: col?.actions || "Actions",
    view: col?.view || "View",
    edit: col?.edit || "Edit",
    delete: col?.delete || "Delete",
    selectAll: col?.selectAll || "Select all",
    selectRow: col?.selectRow || "Select row",
    openMenu: col?.openMenu || "Open menu",
    generateCredentials: col?.generateCredentials || "Generate Credentials",
  }

  const statusLabels = getStatusLabels(staffDict)
  const typeLabels = getTypeLabels(staffDict)

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
          <ActionMenu align={isAr ? "start" : "end"} srLabel={t.openMenu}>
            {actions?.onView && (
              <DropdownMenuItem onClick={() => actions.onView?.(staff)}>
                {t.view}
              </DropdownMenuItem>
            )}
            {actions?.onEdit && permissions.showEditAction && (
              <DropdownMenuItem onClick={() => actions.onEdit?.(staff)}>
                {t.edit}
              </DropdownMenuItem>
            )}
            {actions?.onGenerateCredentials && permissions.showAddButton && (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  actions.onGenerateCredentials?.(
                    staff.id,
                    staff.name,
                    staff.position || undefined
                  )
                }}
              >
                {t.generateCredentials}
              </DropdownMenuItem>
            )}
            {actions?.onDelete && permissions.showDeleteAction && (
              <>
                <DropdownMenuSeparator />
                <ActionMenuItem
                  label={t.delete}
                  variant="destructive"
                  onClick={() => actions.onDelete?.(staff)}
                />
              </>
            )}
          </ActionMenu>
        )
      },
    },
  ]
}
