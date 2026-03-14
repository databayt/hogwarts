"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
import type { Locale } from "@/components/internationalization/config"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { ExamRow } from "./types"

export type { ExamRow }

export interface ExamColumnCallbacks {
  onDelete?: (row: ExamRow) => void
  lang?: Locale
}

const statusLabels: Record<string, Record<string, string>> = {
  ar: {
    PLANNED: "مخطط",
    IN_PROGRESS: "جاري",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
  },
  en: {
    PLANNED: "Planned",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },
}

const examTypeLabelsI18n: Record<string, Record<string, string>> = {
  ar: {
    MIDTERM: "منتصف",
    FINAL: "نهائي",
    QUIZ: "اختبار",
    TEST: "اختبار",
    ASSIGNMENT: "واجب",
    HOMEWORK: "واجب",
    PROJECT: "مشروع",
    PRACTICAL: "عملي",
  },
  en: {
    MIDTERM: "Mid",
    FINAL: "Final",
    QUIZ: "Quiz",
    TEST: "Test",
    ASSIGNMENT: "HW",
    HOMEWORK: "HW",
    PROJECT: "Proj",
    PRACTICAL: "Prac",
  },
}

const getStatusBadge = (status: string, lang = "en") => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PLANNED: "default",
    IN_PROGRESS: "secondary",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  }

  const labels = statusLabels[lang] || statusLabels.en
  return (
    <Badge variant={variants[status] || "default"}>
      {labels[status] || status.replace("_", " ")}
    </Badge>
  )
}

// Short labels for exam types - keep badges compact
const examTypeLabels: Record<string, string> = {
  MIDTERM: "Mid",
  FINAL: "Final",
  QUIZ: "Quiz",
  TEST: "Test",
  ASSIGNMENT: "HW",
  HOMEWORK: "HW",
  PROJECT: "Proj",
  PRACTICAL: "Prac",
}

const getExamTypeBadge = (type: string, lang = "en") => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    MIDTERM: "default",
    FINAL: "secondary",
    QUIZ: "outline",
    TEST: "outline",
    ASSIGNMENT: "destructive",
    HOMEWORK: "destructive",
    PROJECT: "default",
    PRACTICAL: "default",
  }

  return (
    <Badge variant={variants[type] || "default"}>
      {(examTypeLabelsI18n[lang] || examTypeLabelsI18n.en)[type] || type}
    </Badge>
  )
}

export const getExamColumns = (
  callbacks?: ExamColumnCallbacks
): ColumnDef<ExamRow>[] => {
  const lang = callbacks?.lang || "en"
  const isAr = lang === "ar"

  const t = {
    title: isAr ? "العنوان" : "Title",
    class: isAr ? "الفصل" : "Class",
    subject: isAr ? "المادة" : "Subject",
    type: isAr ? "النوع" : "Type",
    date: isAr ? "التاريخ" : "Date",
    startTime: isAr ? "وقت البدء" : "Start Time",
    duration: isAr ? "المدة" : "Duration",
    totalMarks: isAr ? "الدرجة الكلية" : "Total Marks",
    status: isAr ? "الحالة" : "Status",
    actions: isAr ? "إجراءات" : "Actions",
    view: isAr ? "عرض" : "View",
    edit: isAr ? "تعديل" : "Edit",
    delete: isAr ? "حذف" : "Delete",
    min: isAr ? "د" : "min",
    midterm: isAr ? "منتصف الفصل" : "Midterm",
    final: isAr ? "نهائي" : "Final",
    quiz: isAr ? "اختبار قصير" : "Quiz",
    assignment: isAr ? "واجب" : "Assignment",
    project: isAr ? "مشروع" : "Project",
    planned: isAr ? "مخطط" : "Planned",
    inProgress: isAr ? "جاري" : "In Progress",
    completed: isAr ? "مكتمل" : "Completed",
    cancelled: isAr ? "ملغي" : "Cancelled",
  }

  return [
    {
      accessorKey: "title",
      id: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.title} />
      ),
      meta: { label: t.title, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "className",
      id: "className",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.class} />
      ),
      meta: { label: t.class, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "subjectName",
      id: "subjectName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.subject} />
      ),
      meta: { label: t.subject, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "examType",
      id: "examType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.type} />
      ),
      cell: ({ getValue }) => getExamTypeBadge(getValue<string>(), lang),
      meta: {
        label: t.type,
        variant: "select",
        options: [
          { label: t.midterm, value: "MIDTERM" },
          { label: t.final, value: "FINAL" },
          { label: t.quiz, value: "QUIZ" },
          { label: t.assignment, value: "ASSIGNMENT" },
          { label: t.project, value: "PROJECT" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "examDate",
      id: "examDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.date} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            isAr ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: t.date, variant: "text" },
    },
    {
      accessorKey: "startTime",
      id: "startTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.startTime} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums">{getValue<string>()}</span>
      ),
      meta: { label: t.startTime, variant: "text" },
    },
    {
      accessorKey: "duration",
      id: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.duration} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums">
          {getValue<number>()} {t.min}
        </span>
      ),
      meta: { label: t.duration, variant: "text" },
    },
    {
      accessorKey: "totalMarks",
      id: "totalMarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.totalMarks} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs font-medium tabular-nums">
          {getValue<number>()}
        </span>
      ),
      meta: { label: t.totalMarks, variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ getValue }) => getStatusBadge(getValue<string>(), lang),
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.planned, value: "PLANNED" },
          { label: t.inProgress, value: "IN_PROGRESS" },
          { label: t.completed, value: "COMPLETED" },
          { label: t.cancelled, value: "CANCELLED" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const exam = row.original
        const { openModal } = useModal()

        const onView = () => {
          const qs =
            typeof window !== "undefined" ? window.location.search || "" : ""
          window.location.href = `/exams/${exam.id}${qs}`
        }

        const onEdit = () => openModal(exam.id)

        const onDelete = () => {
          callbacks?.onDelete?.(exam)
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.actions}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onView}>{t.view}</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>{t.delete}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getExamColumns()
// inside useMemo in client components to avoid SSR hook issues.
