"use client"

import { useState } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Copy, Eye, KeyRound } from "lucide-react"

import { initialsOf, type NameContact } from "@/lib/name-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { NameContactLine } from "@/components/school-dashboard/shared/name-contact-line"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { fillT, roleLabel } from "./labels"
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
  onResetPassword?: (member: MemberRow) => void
  /** Own row: admins change their own password in Settings, not here. */
  currentUserId?: string
  canManage?: boolean
  /** What shows under the name: the phone (default) or the email. */
  nameContact?: NameContact
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

function CopyEmailCell({
  email,
  label,
}: {
  email: string | null
  label: string
}) {
  const [copied, setCopied] = useState(false)

  if (!email) return <span className="text-muted-foreground">-</span>

  const handleCopy = async () => {
    await navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground" dir="ltr">
        {email}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleCopy}
        aria-label={label}
        title={label}
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
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      cell: ({ row }) => {
        const member = row.original
        const locale = options.lang || "en"
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={member.image || undefined} alt={member.name} />
              <AvatarFallback className="bg-primary/10 text-xs">
                {initialsOf(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Link
                href={`/${locale}/profile/${member.id}`}
                className="font-medium hover:underline"
              >
                <bdi dir="auto">{member.name}</bdi>
              </Link>
              <NameContactLine
                email={member.email}
                phone={member.phone}
                prefer={options.nameContact ?? "phone"}
                empty="-"
                className="max-w-[180px] truncate"
              />
            </div>
          </div>
        )
      },
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
      size: 250,
    },
    {
      accessorKey: "email",
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.email} />
      ),
      cell: ({ row }) => (
        <CopyEmailCell email={row.original.email} label={t.copyEmail} />
      ),
      meta: { label: t.email, variant: "text" },
    },
    {
      accessorKey: "role",
      id: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.role} />
      ),
      cell: ({ getValue }) => {
        const role = getValue<string>()
        return <Badge variant="secondary">{roleLabel(t, role)}</Badge>
      },
      meta: {
        label: t.role,
        variant: "select",
        options: (
          [
            "ADMIN",
            "TEACHER",
            "STUDENT",
            "GUARDIAN",
            "STAFF",
            "ACCOUNTANT",
          ] as const
        ).map((value) => ({ label: roleLabel(t, value), value })),
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "memberStatus",
      id: "memberStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return (
          <Badge variant={statusVariant(status)}>{t[status] || status}</Badge>
        )
      },
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: "active" },
          { label: t.suspended, value: "suspended" },
          { label: t.inactive, value: "inactive" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "gradeName",
      id: "gradeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.grade} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {getValue<string | null>() || "-"}
        </span>
      ),
      meta: {
        label: t.grade,
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
        <DataTableColumnHeader column={column} title={t.details} />
      ),
      cell: ({ row }) => {
        const { contextInfo, classCount, childCount } = row.original
        const parts = [
          classCount > 0 ? fillT(t.classesCount, { count: classCount }) : null,
          childCount > 0 ? fillT(t.childrenCount, { count: childCount }) : null,
          contextInfo,
        ].filter(Boolean)
        return (
          <span className="text-muted-foreground text-xs">
            {parts.length > 0 ? parts.join(" · ") : "-"}
          </span>
        )
      },
      meta: { label: t.details, variant: "text" },
      enableSorting: false,
    },
    {
      accessorKey: "joinedAtStr",
      id: "joinedAtStr",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.joined} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {getValue<string>()}
        </span>
      ),
      meta: { label: t.joined, variant: "text" },
    },
  ]

  if (canManage) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const member = row.original
        return (
          <ActionMenu srLabel={t.actions}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              icon={Eye}
              label={t.viewProfile}
              href={`/${options.lang || "en"}/profile/${member.id}`}
            />
            {member.id !== options.currentUserId && (
              <ActionMenuItem
                icon={KeyRound}
                label={t.resetPassword}
                onClick={() => options.onResetPassword?.(member)}
              />
            )}
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.changeRole}
              onClick={() => options.onChangeRole?.(member)}
            />
            {member.role === "STUDENT" && (
              <DropdownMenuItem onClick={() => options.onAssignGrade?.(member)}>
                {t.assignGrade}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {member.memberStatus === "suspended" ? (
              <DropdownMenuItem onClick={() => options.onActivate?.(member)}>
                {t.activate}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => options.onSuspend?.(member)}>
                {t.suspend}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.remove}
              variant="destructive"
              onClick={() => options.onRemove?.(member)}
            />
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    })
  }

  return columns
}
