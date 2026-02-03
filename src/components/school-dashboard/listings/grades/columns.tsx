"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

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
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

// Helper to extract assignment type badge - using short labels
function getAssignmentBadge(title: string): { name: string; type: string } {
  const lower = title.toLowerCase()
  if (lower.includes("homework"))
    return {
      name: formatWeekLabel(title.replace(/homework\s*/i, "").trim()) || "HW",
      type: "HW",
    }
  if (lower.includes("quiz"))
    return {
      name: formatWeekLabel(title.replace(/quiz\s*/i, "").trim()) || "Quiz",
      type: "Quiz",
    }
  if (lower.includes("exam"))
    return {
      name: formatWeekLabel(title.replace(/exam\s*/i, "").trim()) || "Exam",
      type: "Exam",
    }
  if (lower.includes("project"))
    return {
      name: formatWeekLabel(title.replace(/project\s*/i, "").trim()) || "Proj",
      type: "Proj",
    }
  if (lower.includes("test"))
    return {
      name: formatWeekLabel(title.replace(/test\s*/i, "").trim()) || "Test",
      type: "Test",
    }
  if (lower.includes("midterm")) return { name: "Mid", type: "Mid" }
  if (lower.includes("final")) return { name: "Final", type: "Final" }
  return { name: formatWeekLabel(title), type: "Assgn" }
}

// Simplify week labels: "Week 1" → "W1", "Week1" → "W1", "week 10" → "W10"
function formatWeekLabel(text: string): string {
  if (!text) return text
  return text
    .replace(/\bweek\s*(\d+)\b/gi, "W$1") // "Week 1" or "week1" → "W1"
    .replace(/\b1st\s*week\b/gi, "W1")
    .replace(/\b2nd\s*week\b/gi, "W2")
    .replace(/\b3rd\s*week\b/gi, "W3")
    .replace(/\b(\d+)(st|nd|rd|th)\s*week\b/gi, "W$1")
    .trim()
}

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
  className: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  createdAt: string
}

export interface ResultColumnCallbacks {
  onDelete?: (row: ResultRow) => void
}

export const resultColumns = (
  t: Dictionary["school"]["grades"],
  locale: Locale = "en",
  callbacks?: ResultColumnCallbacks
): ColumnDef<ResultRow>[] => [
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
    cell: ({ getValue }) => {
      const title = getValue<string>() || ""
      const { name, type } = getAssignmentBadge(title)
      return (
        <div className="flex items-center gap-2">
          <span>{name}</span>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {type}
          </Badge>
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
        <small className="tabular-nums">
          {new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)}
          %
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
      return <Badge variant={getGradeVariant(grade)}>{grade}</Badge>
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
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Ellipsis className="h-4 w-4" />
              <span className="sr-only">{t.openMenu}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/grades/${result.id}`}>
                {locale === "ar" ? "عرض" : "View"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              {locale === "ar" ? "تعديل" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>
              {locale === "ar" ? "حذف" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
]
