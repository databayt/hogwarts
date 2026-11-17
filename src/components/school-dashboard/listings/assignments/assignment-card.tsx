"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"

import type { UIPermissions } from "@/lib/rbac/ui-permissions"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { useModal } from "@/components/atom/modal/context"

import { formatAssignmentDate } from "./date"
import { statusLabel, statusVariant, typeLabel } from "./labels"
import type { AssignmentRow } from "./list-core"

interface Props {
  row: AssignmentRow
  lang: string
  /** `school.assignments` */
  dictionary?: Record<string, any>
  common?: Record<string, any>
  permissions: UIPermissions
  onDelete?: (row: AssignmentRow) => void
}

/**
 * The phone's version of a table row: the whole card opens the assignment,
 * status badge on the title's line, subject · class under it, then type ·
 * points · due date. Edit / delete sit in a 44px menu at the end. Logical
 * spacing only, so it reads right in /ar and /en.
 */
export function AssignmentCard({
  row,
  lang,
  dictionary,
  common,
  permissions,
  onDelete,
}: Props) {
  const { openModal } = useModal()
  const types = (dictionary?.detail?.types ?? {}) as Record<string, string>
  const statuses = (dictionary?.detail?.statuses ?? {}) as Record<string, string>
  const href = `/${lang}/assignments/${row.id}`
  const actionsLabel = (dictionary?.actions as string) ?? ""
  const hasMenu = permissions.showEditAction || permissions.showDeleteAction

  return (
    <li className="relative flex items-start gap-1 rounded-xl border p-1 ps-4">
      <Link
        href={href}
        className="focus-visible:ring-ring min-h-11 min-w-0 flex-1 space-y-1.5 rounded-lg py-3 outline-none focus-visible:ring-2"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="font-medium break-words">{row.title}</span>
          <Badge
            variant={statusVariant(row.status)}
            className="shrink-0 font-normal"
          >
            {statusLabel(statuses, row.status)}
          </Badge>
        </span>
        {row.subjectName || row.className ? (
          <span className="text-muted-foreground block text-sm">
            {[row.subjectName, row.className].filter(Boolean).join(" · ")}
          </span>
        ) : null}
        <span className="text-muted-foreground block text-xs tabular-nums">
          {[
            typeLabel(types, row.type),
            `${row.totalPoints} ${dictionary?.points ?? ""}`,
            formatAssignmentDate(row.dueDate, lang),
          ].join(" · ")}
        </span>
      </Link>
      {hasMenu ? (
        <div className="[&_button]:size-11">
          <ActionMenu srLabel={actionsLabel}>
            <DropdownMenuLabel>{actionsLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem label={common?.actions?.view ?? ""} href={href} />
            {permissions.showEditAction && (
              <ActionMenuItem
                label={common?.actions?.edit ?? ""}
                onClick={() => openModal(row.id)}
              />
            )}
            {permissions.showDeleteAction && (
              <ActionMenuItem
                label={common?.actions?.delete ?? ""}
                onClick={() => onDelete?.(row)}
              />
            )}
          </ActionMenu>
        </div>
      ) : null}
    </li>
  )
}
