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

export type SubjectRow = {
  id: string
  name: string
  department: string
  createdAt: string
}

/**
 * Get localized subject name based on locale
 */
export function getLocalizedSubjectName(
  row: SubjectRow,
  locale: Locale
): string {
  return row.name || ""
}

/**
 * Get localized department name based on locale
 */
export function getLocalizedDepartmentName(
  row: SubjectRow,
  locale: Locale
): string {
  return row.department || ""
}

export interface SubjectColumnCallbacks {
  onDelete?: (row: SubjectRow) => void
}

export const getSubjectColumns = (
  dictionary?: Dictionary["school"]["subjects"],
  lang?: Locale,
  callbacks?: SubjectColumnCallbacks
): ColumnDef<SubjectRow>[] => {
  const t = {
    subject: dictionary?.subject || "Subject",
    department: dictionary?.department || "Department",
    created: dictionary?.created || "Created",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.view || "View",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
  }

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.subject} />
      ),
      meta: { label: t.subject, variant: "text" },
      id: "name",
      cell: ({ row }) => {
        const displayName = lang
          ? getLocalizedSubjectName(row.original, lang)
          : row.original.name
        return <span>{displayName}</span>
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.department} />
      ),
      meta: { label: t.department, variant: "text" },
      id: "department",
      cell: ({ row }) => {
        const displayName = lang
          ? getLocalizedDepartmentName(row.original, lang)
          : row.original.department
        return <span>{displayName}</span>
      },
      enableColumnFilter: true,
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
        const subject = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(subject.id)

        const onDelete = () => {
          callbacks?.onDelete?.(subject)
        }

        return (
          <ActionMenu>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.view}
              href={`/${lang}/subjects/${subject.id}`}
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

// NOTE: Do NOT export pre-generated columns. Always use getSubjectColumns()
// inside useMemo in client components to avoid SSR hook issues.
