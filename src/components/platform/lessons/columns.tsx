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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type LessonRow = {
  id: string
  title: string
  className: string
  teacherName: string
  subjectName: string
  lessonDate: string
  startTime: string
  endTime: string
  status: string
  createdAt: string
}

export interface LessonColumnCallbacks {
  onDelete?: (row: LessonRow) => void
}

const getStatusBadge = (
  status: string,
  statuses?: Dictionary["school"]["lessons"]["statuses"]
) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PLANNED: "default",
    IN_PROGRESS: "secondary",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  }

  const labelMap: Record<string, string> = {
    PLANNED: "planned",
    IN_PROGRESS: "inProgress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  }

  const label =
    (statuses &&
      labelMap[status] &&
      statuses[labelMap[status] as keyof typeof statuses]) ||
    status.replace("_", " ")

  return <Badge variant={variants[status] || "default"}>{label}</Badge>
}

export interface GetLessonColumnsProps {
  dictionary?: Dictionary["school"]["lessons"]
  common?: Dictionary["school"]["common"]
  lang?: Locale
  callbacks?: LessonColumnCallbacks
}

export const getLessonColumns = ({
  dictionary,
  common,
  lang,
  callbacks,
}: GetLessonColumnsProps): ColumnDef<LessonRow>[] => {
  const t = {
    title: dictionary?.title || "Title",
    class: dictionary?.class || "Class",
    teacher: dictionary?.teacher || "Teacher",
    subject: dictionary?.subject || "Subject",
    date: dictionary?.date || "Date",
    startTime: dictionary?.startTime || "Start Time",
    endTime: dictionary?.endTime || "End Time",
    status: dictionary?.status || "Status",
    actions: "Actions",
    view: common?.actions?.view || "View",
    edit: common?.actions?.edit || "Edit",
    delete: common?.actions?.delete || "Delete",
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
      accessorKey: "teacherName",
      id: "teacherName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.teacher} />
      ),
      meta: { label: t.teacher, variant: "text" },
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
      accessorKey: "lessonDate",
      id: "lessonDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.date} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
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
      accessorKey: "endTime",
      id: "endTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.endTime} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums">{getValue<string>()}</span>
      ),
      meta: { label: t.endTime, variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ getValue }) =>
        getStatusBadge(getValue<string>(), dictionary?.statuses),
      meta: {
        label: t.status,
        variant: "select",
        options: [
          {
            label: dictionary?.statuses?.planned || "Planned",
            value: "PLANNED",
          },
          {
            label: dictionary?.statuses?.inProgress || "In Progress",
            value: "IN_PROGRESS",
          },
          {
            label: dictionary?.statuses?.completed || "Completed",
            value: "COMPLETED",
          },
          {
            label: dictionary?.statuses?.cancelled || "Cancelled",
            value: "CANCELLED",
          },
        ],
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const lesson = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(lesson.id)

        const onDelete = () => {
          callbacks?.onDelete?.(lesson)
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
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/lessons/${lesson.id}`}>{t.view}</Link>
              </DropdownMenuItem>
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

// NOTE: Do NOT export pre-generated columns. Always use getLessonColumns()
// inside useMemo in client components to avoid SSR hook issues.
