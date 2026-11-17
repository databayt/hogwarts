"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"

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

import { formatAssignmentDate } from "./date"
import {
  ASSIGNMENT_TYPES,
  statusLabel,
  statusVariant,
  typeLabel,
} from "./labels"
import type { AssignmentRow } from "./list-core"

export type { AssignmentRow }

const STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "IN_PROGRESS",
  "COMPLETED",
  "GRADED",
] as const

export interface AssignmentColumnCallbacks {
  onDelete?: (row: AssignmentRow) => void
}

export interface GetAssignmentColumnsProps {
  dictionary?: Dictionary["school"]["assignments"]
  common?: Dictionary["school"]["common"]
  lang?: Locale
  callbacks?: AssignmentColumnCallbacks
  permissions?: UIPermissions
}

export const getAssignmentColumns = ({
  dictionary,
  common,
  lang,
  callbacks,
  permissions = FULL_UI_PERMISSIONS,
}: GetAssignmentColumnsProps): ColumnDef<AssignmentRow>[] => {
  const d = (dictionary ?? {}) as Record<string, any>
  const types = (d.detail?.types ?? {}) as Record<string, string>
  const statuses = (d.detail?.statuses ?? {}) as Record<string, string>
  const t = {
    title: d.titleColumn ?? "",
    type: d.type ?? "",
    status: d.detail?.status ?? "",
    points: d.points ?? "",
    dueDate: d.dueDate ?? "",
    created: d.created ?? "",
    actions: d.actions ?? "",
    view: common?.actions?.view ?? "",
    edit: common?.actions?.edit ?? "",
    delete: common?.actions?.delete ?? "",
  }

  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.title} />
      ),
      meta: { label: t.title, variant: "text" },
      id: "title",
      enableColumnFilter: true,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.type} />
      ),
      cell: ({ getValue }) => (
        <Badge variant="outline" className="font-normal">
          {typeLabel(types, getValue<string>())}
        </Badge>
      ),
      meta: {
        label: t.type,
        variant: "select",
        options: ASSIGNMENT_TYPES.map((v) => ({
          label: typeLabel(types, v),
          value: v,
        })),
      },
      id: "type",
      enableColumnFilter: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ getValue }) => (
        <Badge
          variant={statusVariant(getValue<string>())}
          className="font-normal"
        >
          {statusLabel(statuses, getValue<string>())}
        </Badge>
      ),
      meta: {
        label: t.status,
        variant: "select",
        options: STATUSES.map((v) => ({
          label: statusLabel(statuses, v),
          value: v,
        })),
      },
      id: "status",
      enableColumnFilter: false,
    },
    {
      accessorKey: "totalPoints",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.points} />
      ),
      meta: { label: t.points, variant: "number" },
      id: "totalPoints",
      enableColumnFilter: true,
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.dueDate} />
      ),
      meta: { label: t.dueDate, variant: "text" },
      id: "dueDate",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatAssignmentDate(getValue<string>(), lang)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      meta: { label: t.created, variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatAssignmentDate(getValue<string>(), lang)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const assignment = row.original
        const onDelete = () => {
          callbacks?.onDelete?.(assignment)
        }
        return (
          <ActionMenu srLabel={t.actions}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.view}
              href={`/${lang}/assignments/${assignment.id}`}
            />
            {permissions.showEditAction && (
              // Edit reopens the wizard on this assignment (it loads the
              // saved values); the old modal form was never mounted, so the
              // item did nothing (Al-Ibda, 11-17).
              <ActionMenuItem
                label={t.edit}
                href={`/${lang}/assignments/add/${assignment.id}/information`}
              />
            )}
            {permissions.showDeleteAction && (
              <ActionMenuItem label={t.delete} onClick={onDelete} />
            )}
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getAssignmentColumns()
// inside useMemo in client components to avoid SSR hook issues.
