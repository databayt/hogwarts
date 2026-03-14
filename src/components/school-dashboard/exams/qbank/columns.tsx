"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
  subjects?: { label: string; value: string }[]
  lang?: string
}

const getQuestionTypeBadge = (type: string, lang = "en") => {
  const labels: Record<string, Record<string, string>> = {
    ar: {
      MULTIPLE_CHOICE: "اختيار متعدد",
      TRUE_FALSE: "صح/خطأ",
      FILL_BLANK: "أكمل الفراغ",
      SHORT_ANSWER: "إجابة قصيرة",
      ESSAY: "مقال",
      MATCHING: "مطابقة",
      ORDERING: "ترتيب",
      MULTI_SELECT: "اختيار متعدد",
    },
    en: {},
  }
  const arLabel = labels.ar[type]
  const config = QUESTION_TYPES.find((qt) => qt.value === type)
  const label = lang === "ar" && arLabel ? arLabel : config?.label || type
  return <Badge variant="outline">{label}</Badge>
}

const getDifficultyBadge = (difficulty: string, lang = "en") => {
  const labels: Record<string, string> =
    lang === "ar"
      ? { EASY: "سهل", MEDIUM: "متوسط", HARD: "صعب" }
      : { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" }
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
      {labels[difficulty] || difficulty}
    </Badge>
  )
}

const getBloomBadge = (bloomLevel: string, lang = "en") => {
  const config = BLOOM_LEVELS.find((bl) => bl.value === bloomLevel)
  const labels: Record<string, string> =
    lang === "ar"
      ? {
          REMEMBER: "تذكر",
          UNDERSTAND: "فهم",
          APPLY: "تطبيق",
          ANALYZE: "تحليل",
          EVALUATE: "تقييم",
          CREATE: "إبداع",
        }
      : {}
  const label =
    (lang === "ar" && labels[bloomLevel]) || config?.label || bloomLevel
  return (
    <Badge
      variant="outline"
      style={{ backgroundColor: config?.color, borderColor: config?.color }}
      className="text-xs"
    >
      {label}
    </Badge>
  )
}

const getSourceBadge = (source: string, lang = "en") => {
  const labels: Record<string, string> =
    lang === "ar"
      ? { MANUAL: "يدوي", AI: "ذكاء اصطناعي", IMPORTED: "مستورد" }
      : { MANUAL: "Manual", AI: "AI", IMPORTED: "Imported" }
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
      {labels[source] || source}
    </Badge>
  )
}

export const getQuestionBankColumns = (
  callbacks?: QuestionBankColumnCallbacks
): ColumnDef<QuestionBankRow>[] => {
  const lang = callbacks?.lang || "en"
  const isAr = lang === "ar"

  const t = {
    question: isAr ? "السؤال" : "Question",
    type: isAr ? "النوع" : "Type",
    difficulty: isAr ? "الصعوبة" : "Difficulty",
    bloomLevel: isAr ? "مستوى بلوم" : "Bloom Level",
    subject: isAr ? "المادة" : "Subject",
    points: isAr ? "النقاط" : "Points",
    source: isAr ? "المصدر" : "Source",
    used: isAr ? "الاستخدام" : "Used",
    times: isAr ? "مرات" : "times",
    successRate: isAr ? "نسبة النجاح" : "Success Rate",
    quality: isAr ? "الجودة" : "Quality",
    created: isAr ? "تاريخ الإنشاء" : "Created",
    actions: isAr ? "إجراءات" : "Actions",
    view: isAr ? "عرض" : "View",
    edit: isAr ? "تعديل" : "Edit",
    delete: isAr ? "حذف" : "Delete",
    new: isAr ? "جديد" : "New",
    good: isAr ? "جيد" : "Good",
    moderate: isAr ? "متوسط" : "Moderate",
    tooEasy: isAr ? "سهل جداً" : "Too Easy",
    tooHard: isAr ? "صعب جداً" : "Too Hard",
    mismatch: isAr ? "غير متطابق" : "Mismatch",
    manual: isAr ? "يدوي" : "Manual",
    ai: isAr ? "ذكاء اصطناعي" : "AI",
    imported: isAr ? "مستورد" : "Imported",
    openMenu: isAr ? "فتح القائمة" : "Open menu",
  }

  const questionTypeOptions = isAr
    ? [
        { label: "اختيار متعدد", value: "MULTIPLE_CHOICE" },
        { label: "صح/خطأ", value: "TRUE_FALSE" },
        { label: "أكمل الفراغ", value: "FILL_BLANK" },
        { label: "إجابة قصيرة", value: "SHORT_ANSWER" },
        { label: "مقال", value: "ESSAY" },
        { label: "مطابقة", value: "MATCHING" },
        { label: "ترتيب", value: "ORDERING" },
        { label: "اختيار متعدد", value: "MULTI_SELECT" },
      ]
    : QUESTION_TYPES.map((qt) => ({ label: qt.label, value: qt.value }))

  const difficultyOptions = isAr
    ? [
        { label: "سهل", value: "EASY" },
        { label: "متوسط", value: "MEDIUM" },
        { label: "صعب", value: "HARD" },
      ]
    : DIFFICULTY_LEVELS.map((dl) => ({ label: dl.label, value: dl.value }))

  const bloomOptions = isAr
    ? [
        { label: "تذكر", value: "REMEMBER" },
        { label: "فهم", value: "UNDERSTAND" },
        { label: "تطبيق", value: "APPLY" },
        { label: "تحليل", value: "ANALYZE" },
        { label: "تقييم", value: "EVALUATE" },
        { label: "إبداع", value: "CREATE" },
      ]
    : BLOOM_LEVELS.map((bl) => ({ label: bl.label, value: bl.value }))

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
      cell: ({ getValue }) => getQuestionTypeBadge(getValue<string>(), lang),
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
      cell: ({ getValue }) => getDifficultyBadge(getValue<string>(), lang),
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
      cell: ({ getValue }) => getBloomBadge(getValue<string>(), lang),
      meta: {
        label: t.bloomLevel,
        variant: "select",
        options: bloomOptions,
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "subjectName",
      id: "subjectName",
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
      cell: ({ getValue }) => getSourceBadge(getValue<string>(), lang),
      meta: {
        label: t.source,
        variant: "select",
        options: [
          { label: t.manual, value: "MANUAL" },
          { label: t.ai, value: "AI" },
          { label: t.imported, value: "IMPORTED" },
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.openMenu}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"}>
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onView}>
                <Eye className="me-2 h-4 w-4" />
                {t.view}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
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

// NOTE: Do NOT export pre-generated columns. Always use getQuestionBankColumns()
// inside useMemo in client components to avoid SSR hook issues.
