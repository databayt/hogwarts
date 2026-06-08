"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"

import { formatDate } from "@/lib/i18n-format"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

/**
 * Callback options passed from the table component for instant UI updates.
 */
export interface ColumnCallbacks {
  onEdit?: (id: string) => void
  onDelete?: (row: LiveClassRow) => void
  permissions?: UIPermissions
}

// Single-language row type (serialized for the client table).
export type LiveClassRow = {
  id: string
  title: string
  lang: string
  teacherId: string
  teacherName: string
  subjectId: string | null
  subjectName: string | null
  sectionId: string | null
  sectionName: string | null
  status: string
  meetingUrl: string | null
  meetingProvider: string | null
  scheduledStart: string
  scheduledEnd: string
  createdAt: string
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  scheduled: "outline",
  live: "default",
  ended: "secondary",
  cancelled: "secondary",
  failed: "destructive",
}

function formatTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const getLiveClassColumns = (
  dictionary: Dictionary["school"]["liveClasses"],
  locale: Locale,
  callbacks?: ColumnCallbacks
): ColumnDef<LiveClassRow>[] => {
  const t = dictionary
  const c = t.columns
  const permissions = callbacks?.permissions ?? FULL_UI_PERMISSIONS

  const statusOptions = [
    { label: t.status.scheduled, value: "scheduled" },
    { label: t.status.live, value: "live" },
    { label: t.status.ended, value: "ended" },
    { label: t.status.cancelled, value: "cancelled" },
    { label: t.status.failed, value: "failed" },
  ]

  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c.title} />
      ),
      meta: { label: c.title, variant: "text" },
      enableColumnFilter: true,
      filterFn: (row, id, filterValue: string) => {
        const title = row.original.title?.toLowerCase() || ""
        return title.includes(String(filterValue).toLowerCase())
      },
    },
    {
      accessorKey: "teacherName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c.teacher} />
      ),
      meta: { label: c.teacher, variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>() || "-"}</span>
      ),
    },
    {
      accessorKey: "subjectName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c.subjectGrade} />
      ),
      meta: { label: c.subjectGrade, variant: "text" },
      cell: ({ row }) => {
        const subject = row.original.subjectName
        const section = row.original.sectionName
        const label = [subject, section].filter(Boolean).join(" · ")
        return (
          <span className="text-muted-foreground text-sm">{label || "-"}</span>
        )
      },
    },
    {
      accessorKey: "scheduledStart",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c.date} />
      ),
      meta: { label: c.date, variant: "text" },
      cell: ({ row }) => {
        const start = row.original.scheduledStart
        const end = row.original.scheduledEnd
        const startDay = formatDate(start, locale)
        const endDay = formatDate(end, locale)
        const label = startDay === endDay ? startDay : `${startDay} – ${endDay}`
        return (
          <span className="text-muted-foreground text-xs tabular-nums">
            {label}
          </span>
        )
      },
    },
    {
      id: "time",
      accessorKey: "scheduledStart",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c.time} />
      ),
      meta: { label: c.time, variant: "text" },
      cell: ({ row }) => {
        const start = formatTime(row.original.scheduledStart, locale)
        const end = formatTime(row.original.scheduledEnd, locale)
        return (
          <span className="text-muted-foreground text-xs tabular-nums">
            {start} – {end}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c.status} />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        const label = t.status[status as keyof typeof t.status] || status
        return (
          <Badge variant={STATUS_VARIANT[status] ?? "outline"}>{label}</Badge>
        )
      },
      meta: {
        label: c.status,
        variant: "select",
        options: statusOptions,
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{c.actions}</span>,
      cell: ({ row }) => {
        const liveClass = row.original

        const onEdit = () => callbacks?.onEdit?.(liveClass.id)
        const onDelete = () => callbacks?.onDelete?.(liveClass)
        const onJoin = () => {
          if (liveClass.meetingUrl) {
            window.open(liveClass.meetingUrl, "_blank", "noopener,noreferrer")
          }
        }

        return (
          <ActionMenu srLabel={t.openMenu}>
            <DropdownMenuLabel>{c.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {liveClass.meetingUrl && (
              <ActionMenuItem label={t.join} onClick={onJoin} />
            )}
            {permissions.showEditAction && (
              <ActionMenuItem label={t.edit} onClick={onEdit} />
            )}
            {permissions.showDeleteAction && (
              <ActionMenuItem
                label={t.delete}
                onClick={onDelete}
                variant="destructive"
              />
            )}
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
