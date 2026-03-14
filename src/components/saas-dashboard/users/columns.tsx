"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { UserRow } from "./actions"
import { userResetSchool, userToggleSuspend } from "./actions"
import { DeleteUserDialog } from "./delete-dialog"

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ getValue }) => (
      <span className="font-mono text-sm">{getValue<string>() || "—"}</span>
    ),
    meta: { label: "Email", variant: "text", placeholder: "Search email" },
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    cell: ({ getValue }) => getValue<string>() || "—",
    meta: {
      label: "Username",
      variant: "text",
      placeholder: "Search username",
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ getValue }) => {
      const role = getValue<string>()
      return (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            role === "DEVELOPER"
              ? "bg-purple-100 text-purple-800"
              : role === "ADMIN"
                ? "bg-blue-100 text-blue-800"
                : role === "USER"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-green-100 text-green-800"
          }`}
        >
          {role}
        </span>
      )
    },
    meta: {
      label: "Role",
      variant: "select",
      placeholder: "Filter role",
      options: [
        { label: "Developer", value: "DEVELOPER" },
        { label: "Admin", value: "ADMIN" },
        { label: "Teacher", value: "TEACHER" },
        { label: "Student", value: "STUDENT" },
        { label: "Guardian", value: "GUARDIAN" },
        { label: "Accountant", value: "ACCOUNTANT" },
        { label: "Staff", value: "STAFF" },
        { label: "User", value: "USER" },
      ],
    },
  },
  {
    accessorKey: "schoolName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="School" />
    ),
    cell: ({ getValue }) => {
      const school = getValue<string | null>()
      return school ? (
        <span className="text-sm">{school}</span>
      ) : (
        <span className="text-muted-foreground text-xs">No school</span>
      )
    },
    meta: { label: "School", variant: "text", placeholder: "Search school" },
  },
  {
    accessorKey: "isSuspended",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => {
      const suspended = getValue<boolean>()
      return (
        <span
          className={`text-xs font-medium ${suspended ? "text-red-600" : "text-green-600"}`}
        >
          {suspended ? "Suspended" : "Active"}
        </span>
      )
    },
    meta: {
      label: "Status",
      variant: "select",
      placeholder: "Filter status",
      options: [
        { label: "Active", value: "false" },
        { label: "Suspended", value: "true" },
      ],
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {formatDate(getValue<string>(), "en")}
      </span>
    ),
    meta: { label: "Created", variant: "text" },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const user = row.original

      const onToggleSuspend = async () => {
        const reason =
          prompt(
            `Reason to ${user.isSuspended ? "unsuspend" : "suspend"} ${user.email}?`
          ) || ""
        const result = await userToggleSuspend({
          userId: user.id,
          reason,
        })
        if (result.success) {
          SuccessToast(
            `User ${result.data.isSuspended ? "suspended" : "unsuspended"}`
          )
        } else {
          ErrorToast(result.error?.message || "Failed to toggle suspension")
        }
      }

      const onResetSchool = async () => {
        const reason =
          prompt(`Reason to detach ${user.email} from school?`) || ""
        const result = await userResetSchool({
          userId: user.id,
          reason,
        })
        if (result.success) {
          SuccessToast(`Detached ${result.data.email} from school`)
        } else {
          ErrorToast(result.error?.message || "Failed to reset school")
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.role !== "DEVELOPER" && (
              <DropdownMenuItem onClick={onToggleSuspend}>
                {user.isSuspended ? "Unsuspend" : "Suspend"}
              </DropdownMenuItem>
            )}
            {user.schoolId && (
              <DropdownMenuItem onClick={onResetSchool}>
                Detach from school
              </DropdownMenuItem>
            )}
            {user.role !== "DEVELOPER" && (
              <>
                <DropdownMenuSeparator />
                <DeleteUserDialog
                  userId={user.id}
                  email={user.email || "unknown"}
                  role={user.role}
                  schoolName={user.schoolName}
                >
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Delete User
                  </DropdownMenuItem>
                </DeleteUserDialog>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
