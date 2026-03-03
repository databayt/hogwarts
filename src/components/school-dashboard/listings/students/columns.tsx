"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { CalendarCheck, Ellipsis, GraduationCap, School } from "lucide-react"

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
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { deleteStudent } from "@/components/school-dashboard/listings/students/actions"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type StudentRow = {
  id: string
  userId: string | null
  name: string
  sectionName: string
  status: string
  createdAt: string
  classCount: number
  gradeCount: number
}

interface ColumnOptions {
  onDeleteSuccess?: (id: string) => void
}

export const getStudentColumns = (
  dictionary?: Dictionary["school"]["students"],
  lang?: Locale,
  options?: ColumnOptions
): ColumnDef<StudentRow>[] => {
  const t = {
    name: dictionary?.fullName || "Name",
    section: dictionary?.section || "Section",
    classes: dictionary?.classes || "Classes",
    grades: dictionary?.grades || "Grades",
    status: dictionary?.status || "Status",
    created: dictionary?.created || "Created",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.view || "View",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
    active: dictionary?.active || "Active",
    inactive: dictionary?.inactive || "Inactive",
    viewGrades: dictionary?.viewGrades || "View Grades",
    viewAttendance: dictionary?.viewAttendance || "View Attendance",
    viewClasses: dictionary?.viewClasses || "View Classes",
  }

  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      cell: ({ row }) => {
        const student = row.original
        if (student.userId) {
          return (
            <Link
              href={`/${lang}/profile/${student.userId}`}
              className="font-medium hover:underline"
            >
              {student.name}
            </Link>
          )
        }
        return <span className="font-medium">{student.name}</span>
      },
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "sectionName",
      id: "sectionName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.section} />
      ),
      meta: { label: t.section, variant: "text" },
    },
    {
      accessorKey: "classCount",
      id: "classCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.classes} />
      ),
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="tabular-nums">
          <School className="me-1 h-3 w-3" />
          {getValue<number>()}
        </Badge>
      ),
      meta: { label: t.classes, variant: "text" },
    },
    {
      accessorKey: "gradeCount",
      id: "gradeCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.grades} />
      ),
      cell: ({ getValue }) => (
        <Badge variant="outline" className="tabular-nums">
          <GraduationCap className="me-1 h-3 w-3" />
          {getValue<number>()}
        </Badge>
      ),
      meta: { label: t.grades, variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: "active" },
          { label: t.inactive, value: "inactive" },
        ],
      },
      enableColumnFilter: true,
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
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: t.created, variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const student = row.original
        const { openModal } = useModal()
        const onEdit = () => openModal(student.id)
        const onDelete = async () => {
          try {
            const deleteMsg = `${t.delete} ${student.name}?`
            const ok = await confirmDeleteDialog(deleteMsg)
            if (!ok) return
            const result = await deleteStudent({ id: student.id })
            if (result.success) {
              DeleteToast()
              // Call the onDeleteSuccess callback to refresh the list
              options?.onDeleteSuccess?.(student.id)
            } else {
              ErrorToast(
                dictionary?.failedToDeleteStudent || "Failed to delete student"
              )
            }
          } catch (e) {
            ErrorToast(
              e instanceof Error
                ? e.message
                : dictionary?.failedToDeleteStudent || "Failed to delete"
            )
          }
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
                <Link
                  href={
                    student.userId
                      ? `/${lang}/profile/${student.userId}`
                      : `/${lang}/students/${student.id}`
                  }
                >
                  {t.view}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/grades?studentId=${student.id}`}>
                  <GraduationCap className="me-2 h-4 w-4" />
                  {t.viewGrades}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/attendance?studentId=${student.id}`}>
                  <CalendarCheck className="me-2 h-4 w-4" />
                  {t.viewAttendance}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/classrooms?studentId=${student.id}`}>
                  <School className="me-2 h-4 w-4" />
                  {t.viewClasses}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

// NOTE: Do NOT export pre-generated columns. Always use getStudentColumns()
// inside useMemo in client components to avoid SSR hook issues.
