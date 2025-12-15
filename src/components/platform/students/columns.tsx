"use client"

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
import { deleteStudent } from "@/components/platform/students/actions"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type StudentRow = {
  id: string
  userId: string | null
  name: string
  className: string
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
    name: dictionary?.fullName || (lang === "ar" ? "الاسم" : "Name"),
    class: dictionary?.class || (lang === "ar" ? "الفصل" : "Class"),
    classes: lang === "ar" ? "الفصول" : "Classes",
    grades: lang === "ar" ? "الدرجات" : "Grades",
    status: dictionary?.status || (lang === "ar" ? "الحالة" : "Status"),
    created:
      dictionary?.created || (lang === "ar" ? "تاريخ الإنشاء" : "Created"),
    actions: lang === "ar" ? "إجراءات" : "Actions",
    view: lang === "ar" ? "عرض" : "View",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
    active: dictionary?.active || (lang === "ar" ? "نشط" : "Active"),
    inactive: dictionary?.inactive || (lang === "ar" ? "غير نشط" : "Inactive"),
    viewGrades: lang === "ar" ? "عرض الدرجات" : "View Grades",
    viewAttendance: lang === "ar" ? "عرض الحضور" : "View Attendance",
    viewClasses: lang === "ar" ? "عرض الفصول" : "View Classes",
  }

  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "className",
      id: "className",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.class} />
      ),
      meta: { label: t.class, variant: "text" },
    },
    {
      accessorKey: "classCount",
      id: "classCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.classes} />
      ),
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="tabular-nums">
          <School className="mr-1 h-3 w-3" />
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
          <GraduationCap className="mr-1 h-3 w-3" />
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
        const onView = () => {
          if (!student.userId) {
            ErrorToast(
              lang === "ar"
                ? "هذا الطالب ليس لديه حساب مستخدم"
                : "This student does not have a user account"
            )
            return
          }
          const qs =
            typeof window !== "undefined" ? window.location.search || "" : ""
          window.location.href = `/profile/${student.userId}${qs}`
        }
        const onEdit = () => openModal(student.id)
        const onDelete = async () => {
          try {
            const deleteMsg =
              lang === "ar" ? `حذف ${student.name}؟` : `Delete ${student.name}?`
            const ok = await confirmDeleteDialog(deleteMsg)
            if (!ok) return
            const result = await deleteStudent({ id: student.id })
            if (result.success) {
              DeleteToast()
              // Call the onDeleteSuccess callback to refresh the list
              options?.onDeleteSuccess?.(student.id)
            } else {
              ErrorToast(
                lang === "ar" ? "فشل حذف الطالب" : "Failed to delete student"
              )
            }
          } catch (e) {
            ErrorToast(
              e instanceof Error
                ? e.message
                : lang === "ar"
                  ? "فشل الحذف"
                  : "Failed to delete"
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
              <DropdownMenuItem onClick={onView}>{t.view}</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/grades?studentId=${student.id}`}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {t.viewGrades}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/attendance?studentId=${student.id}`}>
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  {t.viewAttendance}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/classes?studentId=${student.id}`}>
                  <School className="mr-2 h-4 w-4" />
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
