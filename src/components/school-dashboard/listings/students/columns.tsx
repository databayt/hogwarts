"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  studentId: string | null
  classroom: string | null
  gradeName: string | null
  status: string
  createdAt: string
  email: string | null
  dateOfBirth: string | null
  enrollmentDate: string | null
  wizardStep: string | null
  profilePhotoUrl: string | null
}

interface ColumnOptions {
  onDeleteSuccess?: (id: string) => void
  onGenerateAccessCode?: (studentId: string, studentName: string) => void
  gradeOptions?: Array<{ label: string; value: string }>
}

export const getStudentColumns = (
  dictionary?: Dictionary["school"]["students"],
  lang?: Locale,
  options?: ColumnOptions
): ColumnDef<StudentRow>[] => {
  // Helper to safely access dictionary keys (JSON may have keys not in TS type)
  const d = dictionary as Record<string, string> | undefined
  const t = {
    name: d?.fullName || "Name",
    studentId: d?.studentId || "Student ID",
    classroom: d?.classroom || "Classroom",
    grade: d?.grade || "Grade",
    status: d?.status || "Status",
    created: d?.created || "Created",
    email: d?.email || "Email",
    dateOfBirth: d?.dateOfBirth || "Date of Birth",
    enrollmentDate: d?.enrollmentDate || "Enrollment Date",
    actions: d?.actions || "Actions",
    view: d?.view || "View",
    edit: d?.edit || "Edit",
    delete: d?.delete || "Delete",
    active: d?.active || "Active",
    unassigned: d?.unassigned || "Unassigned",
    incomplete: d?.incomplete || "Incomplete",
    inactive: d?.inactive || "Inactive",
    suspended: d?.suspended || "Suspended",
    graduated: d?.graduated || "Graduated",
    transferred: d?.transferred || "Transferred",
    droppedOut: d?.droppedOut || "Dropped Out",
    draft: d?.draft || "Draft",
    generateAccessCode: d?.generateAccessCode || "Generate Access Code",
    viewGrades: d?.viewGrades || "View Grades",
    viewAttendance: d?.viewAttendance || "View Attendance",
    viewClasses: d?.viewClasses || "View Classes",
    noEmail: d?.noEmail || "No email",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
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
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={student.profilePhotoUrl || ""}
                alt={student.name}
              />
              <AvatarFallback className="bg-primary/10 text-xs">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${lang}/profile/${student.userId || student.id}`}
                  className="font-medium hover:underline"
                >
                  {student.name}
                </Link>
              </div>
              <span className="text-muted-foreground text-xs">
                {student.email || t.noEmail}
              </span>
            </div>
          </div>
        )
      },
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
      size: 250,
    },
    {
      accessorKey: "studentId",
      id: "studentId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.studentId} />
      ),
      meta: { label: t.studentId, variant: "text" },
    },
    {
      accessorKey: "gradeName",
      id: "gradeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.grade} />
      ),
      meta: {
        label: t.grade,
        variant: "select",
        options: options?.gradeOptions || [],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "classroom",
      id: "classroom",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.classroom} />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        if (!val) return <span className="text-muted-foreground">-</span>
        return <span className="text-sm">{val}</span>
      },
      meta: { label: t.classroom, variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ row }) => {
        const student = row.original
        const status = student.status

        // Wizard draft overrides display status
        if (student.wizardStep) {
          return (
            <Link
              href={`/${lang}/students/add/${student.id}/${student.wizardStep}`}
            >
              <Badge variant="outline">{t.draft}</Badge>
            </Link>
          )
        }

        const variants: Record<
          string,
          "default" | "secondary" | "destructive" | "outline"
        > = {
          active: "default",
          unassigned: "outline",
          incomplete: "secondary",
          inactive: "secondary",
          suspended: "destructive",
          graduated: "outline",
          transferred: "outline",
          dropped_out: "secondary",
        }

        const labels: Record<string, string> = {
          active: t.active,
          unassigned: t.unassigned,
          incomplete: t.incomplete,
          inactive: t.inactive,
          suspended: t.suspended,
          graduated: t.graduated,
          transferred: t.transferred,
          dropped_out: t.droppedOut,
        }

        const label = labels[status] || status.replace("_", " ")
        return <Badge variant={variants[status] || "default"}>{label}</Badge>
      },
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: "active" },
          { label: t.unassigned, value: "unassigned" },
          { label: t.incomplete, value: "incomplete" },
          { label: t.draft, value: "draft" },
          { label: t.inactive, value: "inactive" },
          { label: t.suspended, value: "suspended" },
          { label: t.graduated, value: "graduated" },
          { label: t.transferred, value: "transferred" },
          { label: t.droppedOut, value: "dropped_out" },
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
      accessorKey: "email",
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.email} />
      ),
      meta: { label: t.email, variant: "text" },
    },
    {
      accessorKey: "dateOfBirth",
      id: "dateOfBirth",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.dateOfBirth} />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        if (!val) return "-"
        return (
          <span className="text-muted-foreground text-xs tabular-nums">
            {new Date(val).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US"
            )}
          </span>
        )
      },
      meta: { label: t.dateOfBirth, variant: "text" },
    },
    {
      accessorKey: "enrollmentDate",
      id: "enrollmentDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.enrollmentDate} />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        if (!val) return "-"
        return (
          <span className="text-muted-foreground text-xs tabular-nums">
            {new Date(val).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US"
            )}
          </span>
        )
      },
      meta: { label: t.enrollmentDate, variant: "text" },
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
            const ok = await confirmDeleteDialog(undefined, {
              title: `${t.delete} ${student.name}?`,
              description:
                (d as any)?.cannotBeUndone || "This action cannot be undone.",
              confirmText: t.delete,
              cancelText: (d as any)?.cancel || "Cancel",
            })
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
                <Link href={`/${lang}/profile/${student.userId || student.id}`}>
                  {t.view}
                </Link>
              </DropdownMenuItem>
              {student.wizardStep ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${lang}/students/add/${student.id}/${student.wizardStep}`}
                  >
                    {t.edit} ({t.incomplete})
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/grades?studentId=${student.id}`}>
                  {t.viewGrades}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/attendance?studentId=${student.id}`}>
                  {t.viewAttendance}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/classrooms?studentId=${student.id}`}>
                  {t.viewClasses}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  options?.onGenerateAccessCode?.(student.id, student.name)
                }
              >
                {t.generateAccessCode}
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
