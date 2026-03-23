"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"

import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { useModal } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type AssignmentRow = {
  id: string
  title: string
  type: string
  totalPoints: number
  dueDate: string
  createdAt: string
}

export interface AssignmentColumnCallbacks {
  onDelete?: (row: AssignmentRow) => void
}

export interface GetAssignmentColumnsProps {
  dictionary?: Dictionary["school"]["assignments"]
  common?: Dictionary["school"]["common"]
  lang?: Locale
  callbacks?: AssignmentColumnCallbacks
}

export const getAssignmentColumns = ({
  dictionary,
  common,
  lang,
  callbacks,
}: GetAssignmentColumnsProps): ColumnDef<AssignmentRow>[] => {
  const t = {
    title: (dictionary as Record<string, any>)?.titleColumn || "Title",
    type: dictionary?.type || "Type",
    points: dictionary?.points || "Points",
    dueDate: dictionary?.dueDate || "Due Date",
    created: dictionary?.created || "Created",
    actions: (dictionary as Record<string, any>)?.actions || "Actions",
    view: common?.actions?.view || "View",
    edit: common?.actions?.edit || "Edit",
    delete: common?.actions?.delete || "Delete",
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
      meta: { label: t.type, variant: "text" },
      id: "type",
      enableColumnFilter: true,
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
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
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
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const assignment = row.original
        const { openModal } = useModal()
        const onEdit = () => openModal(assignment.id)
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
            <ActionMenuItem label={t.edit} onClick={onEdit} />
            <ActionMenuItem label={t.delete} onClick={onDelete} />
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
