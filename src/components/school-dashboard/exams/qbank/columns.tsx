"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"
import { Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { useModal } from "@/components/atom/modal/context"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import {
  BLOOM_LEVELS,
  getBloomLabels,
  getDifficultyLabels,
  getQuestionTypeLabels,
  getSourceLabels,
} from "./config"
import type { QuestionBankRow } from "./types"

export type { QuestionBankRow }

export interface QuestionBankColumnCallbacks {
  onDelete?: (row: QuestionBankRow) => void
  subjects?: { label: string; value: string }[]
  lang?: string
  /** `dictionary.exams.qbank` — see ./t.ts */
  t?: Record<string, any>
}

const DIFFICULTY_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  EASY: "default",
  MEDIUM: "secondary",
  HARD: "destructive",
}

const SOURCE_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  MANUAL: "outline",
  AI: "secondary",
  IMPORTED: "default",
}

export const QuestionTypeBadge = ({
  type,
  t,
}: {
  type: string
  t?: Record<string, any>
}) => <Badge variant="outline">{getQuestionTypeLabels(t)[type] || type}</Badge>

export const DifficultyBadge = ({
  difficulty,
  t,
}: {
  difficulty: string
  t?: Record<string, any>
}) => (
  <Badge variant={DIFFICULTY_VARIANTS[difficulty] || "outline"}>
    {getDifficultyLabels(t)[difficulty] || difficulty}
  </Badge>
)

const BloomBadge = ({
  bloomLevel,
  t,
}: {
  bloomLevel: string
  t?: Record<string, any>
}) => {
  const config = BLOOM_LEVELS.find((bl) => bl.value === bloomLevel)
  return (
    <Badge
      variant="outline"
      style={{ backgroundColor: config?.color, borderColor: config?.color }}
      className="text-xs"
    >
      {getBloomLabels(t)[bloomLevel] || bloomLevel}
    </Badge>
  )
}

const SourceBadge = ({
  source,
  t,
}: {
  source: string
  t?: Record<string, any>
}) => (
  <Badge variant={SOURCE_VARIANTS[source] || "outline"} className="text-xs">
    {getSourceLabels(t)[source] || source}
  </Badge>
)

export const getQuestionBankColumns = (
  callbacks?: QuestionBankColumnCallbacks
): ColumnDef<QuestionBankRow>[] => {
  const lang = callbacks?.lang || "en"
  const isAr = lang === "ar"
  const dt = callbacks?.t
  const c = (dt?.list?.columns ?? {}) as Record<string, string>
  const l = (dt?.list ?? {}) as Record<string, string>
  const q = (dt?.list?.quality ?? {}) as Record<string, string>

  const t = {
    question: c.question ?? "",
    type: c.type ?? "",
    difficulty: c.difficulty ?? "",
    bloomLevel: c.bloomLevel ?? "",
    subject: c.subject ?? "",
    points: c.points ?? "",
    source: c.source ?? "",
    used: c.used ?? "",
    times: c.times ?? "",
    successRate: c.successRate ?? "",
    quality: c.quality ?? "",
    created: c.created ?? "",
    actions: l.actions ?? "",
    view: l.view ?? "",
    edit: l.edit ?? "",
    delete: l.delete ?? "",
    new: q.new ?? "",
    good: q.good ?? "",
    moderate: q.moderate ?? "",
    tooEasy: q.tooEasy ?? "",
    tooHard: q.tooHard ?? "",
    mismatch: q.mismatch ?? "",
    openMenu: l.openMenu ?? "",
  }
  const typeLabels = getQuestionTypeLabels(dt)
  const difficultyLabels = getDifficultyLabels(dt)
  const bloomLabels = getBloomLabels(dt)
  const sourceLabels = getSourceLabels(dt)

  const questionTypeOptions = Object.entries(typeLabels).map(
    ([value, label]) => ({ label, value })
  )
  const difficultyOptions = Object.entries(difficultyLabels).map(
    ([value, label]) => ({ label, value })
  )
  const bloomOptions = Object.entries(bloomLabels).map(([value, label]) => ({
    label,
    value,
  }))

  return [
    {
      accessorKey: "questionText",
      id: "questionText",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.question} />
      ),
      cell: ({ getValue }) => {
        const text = getValue<string>()
        return (
          <div className="max-w-md">
            <p className="truncate text-sm">{text}</p>
          </div>
        )
      },
      meta: { label: t.question, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "questionType",
      id: "questionType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.type} />
      ),
      cell: ({ getValue }) => (
        <QuestionTypeBadge type={getValue<string>()} t={dt} />
      ),
      meta: {
        label: t.type,
        variant: "select",
        options: questionTypeOptions,
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "difficulty",
      id: "difficulty",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.difficulty} />
      ),
      cell: ({ getValue }) => (
        <DifficultyBadge difficulty={getValue<string>()} t={dt} />
      ),
      meta: {
        label: t.difficulty,
        variant: "select",
        options: difficultyOptions,
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "bloomLevel",
      id: "bloomLevel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.bloomLevel} />
      ),
      cell: ({ getValue }) => (
        <BloomBadge bloomLevel={getValue<string>()} t={dt} />
      ),
      meta: {
        label: t.bloomLevel,
        variant: "select",
        options: bloomOptions,
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.subject} />
      ),
      meta: {
        label: t.subject,
        variant: callbacks?.subjects?.length ? "select" : "text",
        ...(callbacks?.subjects?.length ? { options: callbacks.subjects } : {}),
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "points",
      id: "points",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.points} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs font-medium tabular-nums">
          {getValue<number>()}
        </span>
      ),
      meta: { label: t.points, variant: "text" },
    },
    {
      accessorKey: "source",
      id: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.source} />
      ),
      cell: ({ getValue }) => (
        <SourceBadge source={getValue<string>()} t={dt} />
      ),
      meta: {
        label: t.source,
        variant: "select",
        options: [
          { label: sourceLabels.MANUAL, value: "MANUAL" },
          { label: sourceLabels.AI, value: "AI" },
          { label: sourceLabels.IMPORTED, value: "IMPORTED" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "timesUsed",
      id: "timesUsed",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.used} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {getValue<number>()} {t.times}
        </span>
      ),
      meta: { label: t.used, variant: "text" },
    },
    {
      accessorKey: "successRate",
      id: "successRate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.successRate} />
      ),
      cell: ({ getValue }) => {
        const rate = getValue<number | null>()
        if (rate === null)
          return <span className="text-muted-foreground text-xs">-</span>

        const color =
          rate >= 80
            ? "text-green-600"
            : rate >= 50
              ? "text-yellow-600"
              : "text-red-600"

        return (
          <span className={`text-xs font-medium tabular-nums ${color}`}>
            {rate.toFixed(1)}%
          </span>
        )
      },
      meta: { label: t.successRate, variant: "text" },
    },
    {
      accessorKey: "qualityFlags",
      id: "quality",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.quality} />
      ),
      cell: ({ row }) => {
        const flags = row.original.qualityFlags
        if (!flags || flags.length === 0) return null

        if (flags.includes("low-usage")) {
          return (
            <Badge variant="outline" className="text-xs text-gray-500">
              {t.new}
            </Badge>
          )
        }

        if (flags.includes("good")) {
          return (
            <Badge
              variant="outline"
              className="border-emerald-300 text-xs text-emerald-600"
            >
              {t.good}
            </Badge>
          )
        }

        if (flags.includes("moderate")) {
          return (
            <Badge
              variant="outline"
              className="border-yellow-300 text-xs text-yellow-600"
            >
              {t.moderate}
            </Badge>
          )
        }

        if (flags.includes("too-easy")) {
          return (
            <Badge
              variant="outline"
              className="border-blue-300 text-xs text-blue-600"
            >
              {t.tooEasy}
            </Badge>
          )
        }

        if (flags.includes("too-hard")) {
          return (
            <Badge
              variant="outline"
              className="border-red-300 text-xs text-red-600"
            >
              {t.tooHard}
            </Badge>
          )
        }

        if (flags.includes("difficulty-mismatch")) {
          return (
            <Badge
              variant="outline"
              className="border-orange-300 text-xs text-orange-600"
            >
              {t.mismatch}
            </Badge>
          )
        }

        return null
      },
      meta: { label: t.quality, variant: "text" },
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            isAr ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: t.created, variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const question = row.original
        const { openModal } = useModal()

        const onView = () => {
          const qs =
            typeof window !== "undefined" ? window.location.search || "" : ""
          window.location.href = `/generate/questions/${question.id}${qs}`
        }

        const onEdit = () => openModal(question.id)

        const onDelete = () => {
          callbacks?.onDelete?.(question)
        }

        return (
          <ActionMenu align={isAr ? "start" : "end"} srLabel={t.openMenu}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem icon={Eye} label={t.view} onClick={onView} />
            <ActionMenuItem label={t.edit} onClick={onEdit} />
            <ActionMenuItem
              label={t.delete}
              onClick={onDelete}
              variant="destructive"
            />
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getQuestionBankColumns()
// inside useMemo in client components to avoid SSR hook issues.
