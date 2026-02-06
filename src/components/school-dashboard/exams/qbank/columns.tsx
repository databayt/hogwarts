"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModal } from "@/components/atom/modal/context"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { BLOOM_LEVELS, DIFFICULTY_LEVELS, QUESTION_TYPES } from "./config"
import type { QuestionBankRow } from "./types"

export type { QuestionBankRow }

export interface QuestionBankColumnCallbacks {
  onDelete?: (row: QuestionBankRow) => void
}

const getQuestionTypeBadge = (type: string) => {
  const config = QUESTION_TYPES.find((qt) => qt.value === type)
  return <Badge variant="outline">{config?.label || type}</Badge>
}

const getDifficultyBadge = (difficulty: string) => {
  const config = DIFFICULTY_LEVELS.find((dl) => dl.value === difficulty)
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    EASY: "default",
    MEDIUM: "secondary",
    HARD: "destructive",
  }

  return (
    <Badge variant={variants[difficulty] || "outline"}>
      {config?.label || difficulty}
    </Badge>
  )
}

const getBloomBadge = (bloomLevel: string) => {
  const config = BLOOM_LEVELS.find((bl) => bl.value === bloomLevel)
  return (
    <Badge
      variant="outline"
      style={{ backgroundColor: config?.color, borderColor: config?.color }}
      className="text-xs"
    >
      {config?.label || bloomLevel}
    </Badge>
  )
}

const getSourceBadge = (source: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    MANUAL: "outline",
    AI: "secondary",
    IMPORTED: "default",
  }

  return (
    <Badge variant={variants[source] || "outline"} className="text-xs">
      {source}
    </Badge>
  )
}

export const getQuestionBankColumns = (
  callbacks?: QuestionBankColumnCallbacks
): ColumnDef<QuestionBankRow>[] => [
  {
    accessorKey: "questionText",
    id: "questionText",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Question" />
    ),
    cell: ({ getValue }) => {
      const text = getValue<string>()
      return (
        <div className="max-w-md">
          <p className="truncate text-sm">{text}</p>
        </div>
      )
    },
    meta: { label: "Question", variant: "text" },
    enableColumnFilter: true,
  },
  {
    accessorKey: "questionType",
    id: "questionType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ getValue }) => getQuestionTypeBadge(getValue<string>()),
    meta: {
      label: "Type",
      variant: "select",
      options: QUESTION_TYPES.map((qt) => ({
        label: qt.label,
        value: qt.value,
      })),
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "difficulty",
    id: "difficulty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Difficulty" />
    ),
    cell: ({ getValue }) => getDifficultyBadge(getValue<string>()),
    meta: {
      label: "Difficulty",
      variant: "select",
      options: DIFFICULTY_LEVELS.map((dl) => ({
        label: dl.label,
        value: dl.value,
      })),
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "bloomLevel",
    id: "bloomLevel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bloom Level" />
    ),
    cell: ({ getValue }) => getBloomBadge(getValue<string>()),
    meta: {
      label: "Bloom Level",
      variant: "select",
      options: BLOOM_LEVELS.map((bl) => ({
        label: bl.label,
        value: bl.value,
      })),
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "subjectName",
    id: "subjectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    meta: { label: "Subject", variant: "text" },
    enableColumnFilter: true,
  },
  {
    accessorKey: "points",
    id: "points",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Points" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs font-medium tabular-nums">
        {getValue<number>()}
      </span>
    ),
    meta: { label: "Points", variant: "text" },
  },
  {
    accessorKey: "source",
    id: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ getValue }) => getSourceBadge(getValue<string>()),
    meta: {
      label: "Source",
      variant: "select",
      options: [
        { label: "Manual", value: "MANUAL" },
        { label: "AI", value: "AI" },
        { label: "Imported", value: "IMPORTED" },
      ],
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "timesUsed",
    id: "timesUsed",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Used" />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {getValue<number>()} times
      </span>
    ),
    meta: { label: "Used", variant: "text" },
  },
  {
    accessorKey: "successRate",
    id: "successRate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Success Rate" />
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
    meta: { label: "Success Rate", variant: "text" },
  },
  {
    accessorKey: "createdAt",
    id: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ),
    meta: { label: "Created", variant: "text" },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Ellipsis className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>
              <Eye className="me-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
]

// NOTE: Do NOT export pre-generated columns. Always use getQuestionBankColumns()
// inside useMemo in client components to avoid SSR hook issues.
