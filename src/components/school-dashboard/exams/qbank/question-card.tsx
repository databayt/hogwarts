"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Eye } from "lucide-react"

import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { useModal } from "@/components/atom/modal/context"

import { DifficultyBadge, QuestionTypeBadge } from "./columns"
import { fmt } from "./t"
import type { QuestionBankRow } from "./types"

interface Props {
  row: QuestionBankRow
  /** `dictionary.exams.qbank` */
  t?: Record<string, any>
  readOnly?: boolean
  onDelete?: (row: QuestionBankRow) => void
}

/**
 * The phone's version of a table row (below md): the question on top, type and
 * difficulty badges under it, then points. View / edit / delete sit in a 44px
 * menu at the end. Logical spacing only, so it reads right in /ar and /en.
 */
export function QuestionCard({ row, t, readOnly, onDelete }: Props) {
  const { openModal } = useModal()
  const l = (t?.list ?? {}) as Record<string, string>

  const onView = () => {
    const qs = typeof window !== "undefined" ? window.location.search || "" : ""
    window.location.href = `/generate/questions/${row.id}${qs}`
  }

  return (
    <li className="flex items-start gap-1 rounded-xl border p-1 ps-4">
      <div className="min-h-11 min-w-0 flex-1 space-y-2 py-3">
        <p className="line-clamp-3 font-medium break-words">
          {row.questionText}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <QuestionTypeBadge type={row.questionType} t={t} />
          <DifficultyBadge difficulty={row.difficulty} t={t} />
        </div>
        <p className="text-muted-foreground text-xs tabular-nums">
          {fmt(l.pointsValue, { count: row.points })}
        </p>
      </div>
      <div className="[&_button]:size-11">
        <ActionMenu srLabel={l.openMenu ?? ""}>
          <DropdownMenuLabel>{l.actions ?? ""}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ActionMenuItem icon={Eye} label={l.view ?? ""} onClick={onView} />
          {!readOnly && (
            <>
              <ActionMenuItem
                label={l.edit ?? ""}
                onClick={() => openModal(row.id)}
              />
              <ActionMenuItem
                label={l.delete ?? ""}
                onClick={() => onDelete?.(row)}
                variant="destructive"
              />
            </>
          )}
        </ActionMenu>
      </div>
    </li>
  )
}
