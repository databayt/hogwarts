"use client"

import { useState } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Copy, Ellipsis, Eye } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  gradeOptions?: { label: string; value: string }[]
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function CopyEmailCell({ email }: { email: string | null }) {
  const [copied, setCopied] = useState(false)

  if (!email) return <span className="text-muted-foreground">-</span>

  const handleCopy = async () => {
    await navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{email}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="text-muted-foreground h-3 w-3" />
        )}
      </Button>
    </div>
  )
}

export const getMemberColumns = (
  options: ColumnOptions
): ColumnDef<MemberRow>[] => {
  const { t, canManage, gradeOptions } = options

  const columns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name || "Name"} />
      ),
      cell: ({ row }) => {
        const member = row.original
        const locale = options.lang || "en"
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={member.image || undefined} alt={member.name} />
              <AvatarFallback className="text-xs">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/${locale}/profile/${member.id}`}
              className="font-medium hover:underline"
            >
              {member.name}
            </Link>
          </div>
        )
      },
      meta: { label: t.name || "Name", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "email",
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.email || "Email"} />
      ),
      cell: ({ row }) => <CopyEmailCell email={row.original.email} />,
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
      meta: {
        label: t.grade || "Grade",
        variant: gradeOptions && gradeOptions.length > 0 ? "select" : "text",
        ...(gradeOptions &&
          gradeOptions.length > 0 && { options: gradeOptions }),
      },
      enableColumnFilter: !!(gradeOptions && gradeOptions.length > 0),
    },
    {
      accessorKey: "contextInfo",
      id: "contextInfo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.details || "Details"} />
      ),
      cell: ({ getValue }) => {
        const info = getValue<string | null>()
        return (
          <span className="text-muted-foreground text-xs">{info || "-"}</span>
        )
      },
      meta: { label: t.details || "Details", variant: "text" },
      enableSorting: false,
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
              <DropdownMenuItem asChild>
                <Link
                  href={`/${options.lang || "en"}/profile/${member.id}`}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {t.viewProfile || "View Profile"}
                </Link>
              </DropdownMenuItem>
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
