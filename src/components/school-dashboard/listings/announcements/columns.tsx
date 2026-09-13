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
 * Callback options for optimistic updates
 * Pass these from the table component for instant UI updates
 */
export interface ColumnCallbacks {
  onDelete?: (announcement: AnnouncementRow) => void
  onTogglePublish?: (announcement: AnnouncementRow) => void
  onEdit?: (announcement: AnnouncementRow) => void
  permissions?: UIPermissions
}

// Single-language row type
export type AnnouncementRow = {
  id: string
  title: string | null
  lang: string
  scope: string
  published: boolean
  createdAt: string
  createdBy: string | null
  priority: string
  pinned: boolean
  featured: boolean
}

/**
 * Get announcement title
 */
function getTitle(row: AnnouncementRow): string {
  return row.title || ""
}

export const getAnnouncementColumns = (
  dictionary: Dictionary["school"]["announcements"],
  locale: Locale,
  callbacks?: ColumnCallbacks
): ColumnDef<AnnouncementRow>[] => {
  const t = dictionary

  // Map dictionary keys to column structure for easier access
  const columns = {
    title: t.announcementTitle,
    scope: t.scope,
    status: t.status,
    created: t.created,
    actions: t.actions,
  }

  return [
    {
      // Use a custom accessor that returns the title
      accessorFn: (row) => getTitle(row),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={columns.title} />
      ),
      meta: { label: columns.title, variant: "text" },
      id: "title",
      enableColumnFilter: true,
      // Filter on title field
      filterFn: (row, id, filterValue: string) => {
        const title = row.original.title?.toLowerCase() || ""
        const search = filterValue.toLowerCase()
        return title.includes(search)
      },
    },
    {
      accessorKey: "scope",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={columns.scope} />
      ),
      cell: ({ getValue }) => {
        const scope = getValue<string>()
        const labels: Record<string, string> = {
          school: t.schoolWide,
          class: t.classSpecific,
          role: t.roleSpecific,
        }
        return <span className="text-sm">{labels[scope] || scope}</span>
      },
      meta: {
        label: columns.scope,
        variant: "select",
        options: [
          { label: t.schoolWide, value: "school" },
          { label: t.classSpecific, value: "class" },
          { label: t.roleSpecific, value: "role" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "published",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={columns.status} />
      ),
      cell: ({ getValue }) => {
        const is = getValue<boolean>()
        return (
          <Badge variant={is ? "default" : "outline"}>
            {is ? t.published : t.draft}
          </Badge>
        )
      },
      meta: {
        label: columns.status,
        variant: "select",
        options: [
          { label: t.published, value: "true" },
          { label: t.draft, value: "false" },
        ],
      },
      id: "published",
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={columns.created} />
      ),
      meta: { label: columns.created, variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDate(getValue<string>(), locale)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{columns.actions}</span>,
      cell: ({ row }) => (
        <AnnouncementRowActions
          announcement={row.original}
          dictionary={t}
          locale={locale}
          callbacks={callbacks}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

/**
 * The row's menu — view, edit, publish, delete — shared by the table's actions
 * cell and the grid's cards, so a phone reading the grid can do everything the
 * table allows.
 *
 * Edit was once `useModal().openModal(id)`, which both broke the rules of hooks
 * (a cell renderer is not a component) and opened nothing — no modal was ever
 * mounted for announcements. It is a plain callback now.
 */
export function AnnouncementRowActions({
  announcement,
  dictionary: t,
  locale,
  callbacks,
}: {
  announcement: AnnouncementRow
  dictionary: Dictionary["school"]["announcements"]
  locale: Locale
  callbacks?: ColumnCallbacks
}) {
  const permissions = callbacks?.permissions ?? FULL_UI_PERMISSIONS

  return (
    <ActionMenu srLabel={t.openMenu}>
      <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <ActionMenuItem
        label={t.view}
        href={`/${locale}/announcements/${announcement.id}`}
      />
      {permissions.showEditAction && (
        <ActionMenuItem
          label={t.edit}
          onClick={() => callbacks?.onEdit?.(announcement)}
        />
      )}
      {permissions.showToggleStatus && (
        <ActionMenuItem
          label={announcement.published ? t.unpublish : t.publish}
          onClick={() => callbacks?.onTogglePublish?.(announcement)}
        />
      )}
      {permissions.showDeleteAction && (
        <ActionMenuItem
          label={t.delete}
          onClick={() => callbacks?.onDelete?.(announcement)}
        />
      )}
    </ActionMenu>
  )
}
