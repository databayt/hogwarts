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
import { Ltr } from "@/components/atom/ltr"
import { useModal } from "@/components/atom/modal/context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

// Helper to extract class badge info
function getClassBadge(className: string): { name: string; section?: string } {
  // Extract section like "A", "B", "Week 1" etc.
  const match = className.match(/(.+?)\s*[-–]\s*(.+)/)
  if (match) return { name: match[1].trim(), section: match[2].trim() }
  return { name: className }
}

// Grade color helper
function getGradeVariant(
  grade: string
): "default" | "secondary" | "destructive" | "outline" {
  if (grade.startsWith("A")) return "default"
  if (grade.startsWith("B")) return "secondary"
  if (grade.startsWith("C")) return "outline"
  return "destructive"
}

export type ResultRow = {
  id: string
  studentName: string
  assignmentTitle: string
  /** AssessmentType or ExamType of the graded item, null when unknown. */
  kind?: string | null
  className: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  createdAt: string
}

export interface ResultColumnCallbacks {
  onDelete?: (row: ResultRow) => void
  permissions?: UIPermissions
}

export const resultColumns = (
  t: Dictionary["school"]["grades"],
  locale: Locale = "en",
  callbacks?: ResultColumnCallbacks
): ColumnDef<ResultRow>[] => {
  const permissions = callbacks?.permissions ?? FULL_UI_PERMISSIONS
  return [
    {
      accessorKey: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.student} />
      ),
      meta: { label: t.student, variant: "text" },
      id: "studentName",
      enableColumnFilter: true,
    },
    {
      accessorKey: "assignmentTitle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.assignment} />
      ),
      meta: { label: t.assignment, variant: "text" },
      id: "assignmentTitle",
      enableColumnFilter: true,
      cell: ({ row, getValue }) => {
        const title = getValue<string>() || ""
        const kind = row.original.kind
        const kindLabel = kind
          ? (t.sourceTypes as Record<string, string>)[kind]
          : undefined
        return (
          <div className="flex items-center gap-2">
            <span>{title || t.unknown}</span>
            {kindLabel && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {kindLabel}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "className",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.class} />
      ),
      meta: { label: t.class, variant: "text" },
      id: "className",
      enableColumnFilter: true,
      cell: ({ getValue }) => {
        const name = getValue<string>() || ""
        const { name: className, section } = getClassBadge(name)
        return (
          <div className="flex items-center gap-2">
            <span>{className}</span>
            {section && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {section}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "score",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.score} />
      ),
      meta: { label: t.score, variant: "number" },
      id: "score",
      enableColumnFilter: true,
    },
    {
      accessorKey: "maxScore",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.maxScore} />
      ),
      meta: { label: t.maxScore, variant: "number" },
      id: "maxScore",
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      meta: { label: t.created, variant: "text" },
      cell: ({ getValue }) => (
        <small className="tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(locale)}
        </small>
      ),
    },
    {
      accessorKey: "percentage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.percentage} />
      ),
      meta: { label: t.percentage, variant: "number" },
      id: "percentage",
      cell: ({ getValue }) => {
        const value = getValue<number>() || 0
        return (
          <small>
            <Ltr>
              {new Intl.NumberFormat(locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)}
              %
            </Ltr>
          </small>
        )
      },
    },
    {
      accessorKey: "grade",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.grade} />
      ),
      meta: { label: t.grade, variant: "text" },
      id: "grade",
      enableColumnFilter: true,
      cell: ({ getValue }) => {
        const grade = getValue<string>() || ""
        return (
          <Badge variant={getGradeVariant(grade)}>
            <Ltr>{grade}</Ltr>
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const result = row.original
        const { openModal } = useModal()
        const onEdit = () => openModal(result.id)
        const onDelete = () => {
          callbacks?.onDelete?.(result)
        }
        // Read-only viewers (students, guardians) cannot open /grades/[id],
        // which is staff-only and shows class-wide stats.
        if (permissions.readOnlyMode) return null
        return (
          <ActionMenu srLabel={t.openMenu}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.view}
              href={`/${locale}/grades/${result.id}`}
            />
            {permissions.showEditAction && (
              <ActionMenuItem label={t.edit} onClick={onEdit} />
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
