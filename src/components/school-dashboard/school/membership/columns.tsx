"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

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
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { UnifiedMember } from "./types"

export type MemberRow = UnifiedMember & {
  joinedAtStr: string
}

interface ColumnOptions {
  onChangeRole?: (member: MemberRow) => void
  onAssignGrade?: (member: MemberRow) => void
  onSuspend?: (member: MemberRow) => void
  onActivate?: (member: MemberRow) => void
  onRemove?: (member: MemberRow) => void
  canManage?: boolean
  t: Record<string, string>
  lang?: string
}

const statusVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default"
    case "suspended":
      return "destructive"
    default:
      return "outline"
  }
}

export const getMemberColumns = (
  options: ColumnOptions
): ColumnDef<MemberRow>[] => {
  const { t, canManage } = options

  const columns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name || "Name"} />
      ),
      meta: { label: t.name || "Name", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "email",
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.email || "Email"} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {getValue<string | null>() || "-"}
        </span>
      ),
      meta: { label: t.email || "Email", variant: "text" },
    },
    {
      accessorKey: "role",
      id: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.role || "Role"} />
      ),
      cell: ({ getValue }) => (
        <Badge variant="secondary">{getValue<string>()}</Badge>
      ),
      meta: {
        label: t.role || "Role",
        variant: "select",
        options: [
          { label: "Admin", value: "ADMIN" },
          { label: "Teacher", value: "TEACHER" },
          { label: "Student", value: "STUDENT" },
          { label: "Guardian", value: "GUARDIAN" },
          { label: "Staff", value: "STAFF" },
          { label: "Accountant", value: "ACCOUNTANT" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "memberStatus",
      id: "memberStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status || "Status"} />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return (
          <Badge variant={statusVariant(status)}>{t[status] || status}</Badge>
        )
      },
      meta: {
        label: t.status || "Status",
        variant: "select",
        options: [
          { label: t.active || "Active", value: "active" },
          { label: t.suspended || "Suspended", value: "suspended" },
          { label: t.inactive || "Inactive", value: "inactive" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "gradeName",
      id: "gradeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.grade || "Grade"} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {getValue<string | null>() || "-"}
        </span>
      ),
      meta: { label: t.grade || "Grade", variant: "text" },
    },
    {
      accessorKey: "joinedAtStr",
      id: "joinedAtStr",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.joined || "Joined"} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {getValue<string>()}
        </span>
      ),
      meta: { label: t.joined || "Joined", variant: "text" },
    },
  ]

  if (canManage) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">{t.actions || "Actions"}</span>,
      cell: ({ row }) => {
        const member = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.actions || "Actions"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.actions || "Actions"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => options.onChangeRole?.(member)}>
                {t.changeRole || "Change Role"}
              </DropdownMenuItem>
              {member.role === "STUDENT" && (
                <DropdownMenuItem
                  onClick={() => options.onAssignGrade?.(member)}
                >
                  {t.assignGrade || "Assign Grade"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {member.memberStatus === "suspended" ? (
                <DropdownMenuItem onClick={() => options.onActivate?.(member)}>
                  {t.activate || "Activate"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => options.onSuspend?.(member)}>
                  {t.suspend || "Suspend"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => options.onRemove?.(member)}
                className="text-destructive"
              >
                {t.remove || "Remove"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    })
  }

  return columns
}
