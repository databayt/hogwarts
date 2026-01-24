"use client"

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
  actions?: StaffColumnActions
): ColumnDef<StaffRow>[] {
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
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const staff = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{staff.name}</span>
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
        <DataTableColumnHeader column={column} title="Position" />
      ),
      cell: ({ row }) => {
        return <span>{row.getValue("position") || "-"}</span>
      },
    },
    {
      accessorKey: "departmentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Department" />
      ),
      cell: ({ row }) => {
        return <span>{row.getValue("departmentName") || "-"}</span>
      },
    },
    {
      accessorKey: "employmentStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("employmentStatus") as string
        const color = getEmploymentStatusColor(status)
        return (
          <Badge
            variant="outline"
            className={`border-${color}-500 text-${color}-500`}
          >
            {status}
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
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("employmentType") as string
        const color = getEmploymentTypeColor(type)
        return (
          <Badge
            variant="secondary"
            className={`bg-${color}-100 text-${color}-700`}
          >
            {type.replace("_", " ")}
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
        <DataTableColumnHeader column={column} title="Account" />
      ),
      cell: ({ row }) => {
        const hasAccount = row.original.userId !== null
        return (
          <Badge variant={hasAccount ? "default" : "secondary"}>
            {hasAccount ? "Active" : "No Account"}
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
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions?.onView && (
                <DropdownMenuItem onClick={() => actions.onView?.(staff)}>
                  View
                </DropdownMenuItem>
              )}
              {actions?.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit?.(staff)}>
                  Edit
                </DropdownMenuItem>
              )}
              {actions?.onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => actions.onDelete?.(staff)}
                  >
                    Delete
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
