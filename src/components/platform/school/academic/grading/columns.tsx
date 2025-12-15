"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ellipsis, Award } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModal } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { ScoreRangeRow } from "./types"

export interface ScoreRangeColumnCallbacks {
  onDelete?: (row: ScoreRangeRow) => void
}

// Grade color mapping
const getGradeVariant = (grade: string): "default" | "secondary" | "destructive" | "outline" => {
  const upperGrade = grade.toUpperCase()
  if (upperGrade.startsWith("A")) return "default"
  if (upperGrade.startsWith("B")) return "secondary"
  if (upperGrade.startsWith("C")) return "outline"
  if (upperGrade.startsWith("D") || upperGrade === "F") return "destructive"
  return "outline"
}

export const getScoreRangeColumns = (
  lang?: Locale,
  callbacks?: ScoreRangeColumnCallbacks
): ColumnDef<ScoreRangeRow>[] => {
  const t = {
    grade: lang === "ar" ? "الدرجة" : "Grade",
    minScore: lang === "ar" ? "الحد الأدنى" : "Min Score",
    maxScore: lang === "ar" ? "الحد الأقصى" : "Max Score",
    range: lang === "ar" ? "النطاق" : "Range",
    created: lang === "ar" ? "تاريخ الإنشاء" : "Created",
    actions: lang === "ar" ? "إجراءات" : "Actions",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
  }

  return [
    {
      accessorKey: "grade",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.grade} />
      ),
      meta: { label: t.grade, variant: "text" },
      id: "grade",
      cell: ({ getValue }) => {
        const grade = getValue<string>()
        return (
          <Badge variant={getGradeVariant(grade)} className="font-bold text-sm">
            <Award className="h-3 w-3 mr-1" />
            {grade}
          </Badge>
        )
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "minScore",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.minScore} />
      ),
      meta: { label: t.minScore, variant: "number" },
      id: "minScore",
      cell: ({ getValue }) => {
        const value = getValue<number>()
        return <span className="font-mono text-sm tabular-nums">{value}%</span>
      },
    },
    {
      accessorKey: "maxScore",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.maxScore} />
      ),
      meta: { label: t.maxScore, variant: "number" },
      id: "maxScore",
      cell: ({ getValue }) => {
        const value = getValue<number>()
        return <span className="font-mono text-sm tabular-nums">{value}%</span>
      },
    },
    {
      id: "range",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.range} />
      ),
      meta: { label: t.range, variant: "text" },
      cell: ({ row }) => {
        const min = row.original.minScore
        const max = row.original.maxScore
        const width = max - min
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{
                  marginLeft: `${min}%`,
                  width: `${width}%`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {min}-{max}%
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      meta: { label: t.created, variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums text-muted-foreground">
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
        const rangeItem = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(rangeItem.id)

        const onDelete = () => {
          callbacks?.onDelete?.(rangeItem)
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
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
