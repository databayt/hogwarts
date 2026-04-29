"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"
import { CalendarCheck, GraduationCap, Users } from "lucide-react"

import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { useModal } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type ClassRow = {
  id: string
  name: string
  subjectName: string
  teacherName: string
  termName: string
  gradeName: string
  courseCode: string | null
  credits: string | number | null
  evaluationType: string
  enrolledStudents: number
  maxCapacity: number
  createdAt: string
}

/**
 * Get localized class name based on locale
 */
export function getLocalizedClassName(row: ClassRow, locale: Locale): string {
  return row.name || ""
}

/**
 * Get localized subject name based on locale
 */
export function getLocalizedSubjectName(row: ClassRow, locale: Locale): string {
  return row.name || ""
}

export interface ClassColumnCallbacks {
  onDelete?: (row: ClassRow) => void
  permissions?: UIPermissions
}

export const getClassColumns = (
  dictionary?: Dictionary["school"]["classes"],
  lang?: Locale,
  callbacks?: ClassColumnCallbacks
): ColumnDef<ClassRow>[] => {
  const permissions = callbacks?.permissions ?? FULL_UI_PERMISSIONS
  const t = {
    className: dictionary?.className || "Class Name",
    courseCode: dictionary?.courseCode || "Course Code",
    subject: dictionary?.subject || "Subject",
    teacher: dictionary?.teacher || "Teacher",
    grade: dictionary?.grade || "Grade",
    credits: dictionary?.credits || "Credits",
    evaluation: dictionary?.evaluation || "Evaluation",
    enrolled: dictionary?.enrolled || "Enrolled",
    term: dictionary?.term || "Term",
    created: dictionary?.created || "Created",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.viewClass || "View",
    edit: dictionary?.editClass || "Edit",
    delete: dictionary?.deleteClass || "Delete",
    viewStudents: dictionary?.viewStudents || "View Students",
    viewGrades: dictionary?.viewGrades || "View Grades",
    viewAttendance: dictionary?.viewAttendance || "View Attendance",
  }

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.className} />
      ),
      meta: { label: t.className, variant: "text" },
      id: "name",
      cell: ({ row }) => {
        const displayName = lang
          ? getLocalizedClassName(row.original, lang)
          : row.original.name
        return <span>{displayName}</span>
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "courseCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.courseCode} />
      ),
      meta: { label: t.courseCode, variant: "text" },
      id: "courseCode",
      enableColumnFilter: true,
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? (
          <span className="font-mono text-xs">{value}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.subject} />
      ),
      meta: { label: t.subject, variant: "text" },
      id: "name",
      cell: ({ row }) => {
        const displayName = lang
          ? getLocalizedSubjectName(row.original, lang)
          : row.original.name
        return <span>{displayName}</span>
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "teacherName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.teacher} />
      ),
      meta: { label: t.teacher, variant: "text" },
      id: "teacherName",
      enableColumnFilter: true,
    },
    {
      accessorKey: "gradeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.grade} />
      ),
      meta: { label: t.grade, variant: "text" },
      id: "gradeName",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return value ? (
          <span className="text-xs">{value}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "credits",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.credits} />
      ),
      meta: { label: t.credits, variant: "number" },
      id: "credits",
      cell: ({ getValue }) => {
        const value = getValue<string | number | null>()
        return value ? (
          <span className="tabular-nums">{value}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "evaluationType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.evaluation} />
      ),
      meta: { label: t.evaluation, variant: "text" },
      id: "evaluationType",
      enableColumnFilter: true,
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return <span className="text-xs">{value}</span>
      },
    },
    {
      accessorKey: "enrolledStudents",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.enrolled} />
      ),
      meta: { label: t.enrolled, variant: "number" },
      id: "enrolledStudents",
      cell: ({ row }) => {
        const enrolled = row.original.enrolledStudents
        const max = row.original.maxCapacity
        return (
          <span className="text-xs tabular-nums">
            {enrolled}/{max}
          </span>
        )
      },
    },
    {
      accessorKey: "termName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.term} />
      ),
      meta: { label: t.term, variant: "text" },
      id: "termName",
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      meta: { label: t.created, variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
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
        const classItem = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(classItem.id)

        const onDelete = () => {
          callbacks?.onDelete?.(classItem)
        }

        return (
          <ActionMenu>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.view}
              href={`/${lang}/classrooms/${classItem.id}`}
            />
            {permissions.showEditAction && (
              <ActionMenuItem label={t.edit} onClick={onEdit} />
            )}
            <DropdownMenuSeparator />
            <ActionMenuItem
              icon={Users}
              label={t.viewStudents}
              href={`/${lang}/students?classId=${classItem.id}`}
            />
            <ActionMenuItem
              icon={GraduationCap}
              label={t.viewGrades}
              href={`/${lang}/grades?classId=${classItem.id}`}
            />
            <ActionMenuItem
              icon={CalendarCheck}
              label={t.viewAttendance}
              href={`/${lang}/attendance?classId=${classItem.id}`}
            />
            {permissions.showDeleteAction && (
              <>
                <DropdownMenuSeparator />
                <ActionMenuItem label={t.delete} onClick={onDelete} />
              </>
            )}
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
