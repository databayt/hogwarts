"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

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

export type SubjectRow = {
  id: string
  subjectName: string
  lang: string
  departmentName: string
  createdAt: string
}

/**
 * Get localized subject name based on locale
 */
export function getLocalizedSubjectName(
  row: SubjectRow,
  locale: Locale
): string {
  return row.subjectName || ""
}

/**
 * Get localized department name based on locale
 */
export function getLocalizedDepartmentName(
  row: SubjectRow,
  locale: Locale
): string {
  return row.departmentName || ""
}

export interface SubjectColumnCallbacks {
  onDelete?: (row: SubjectRow) => void
}

export const getSubjectColumns = (
  dictionary?: Dictionary["school"]["subjects"],
  lang?: Locale,
  callbacks?: SubjectColumnCallbacks
): ColumnDef<SubjectRow>[] => {
  const t = {
    subject: dictionary?.subject || (lang === "ar" ? "المادة" : "Subject"),
    department:
      dictionary?.department || (lang === "ar" ? "القسم" : "Department"),
    created:
      dictionary?.created || (lang === "ar" ? "تاريخ الإنشاء" : "Created"),
    actions: lang === "ar" ? "إجراءات" : "Actions",
    view: lang === "ar" ? "عرض" : "View",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
  }

  return [
    {
      accessorKey: "subjectName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.subject} />
      ),
      meta: { label: t.subject, variant: "text" },
      id: "subjectName",
      cell: ({ row }) => {
        const displayName = lang
          ? getLocalizedSubjectName(row.original, lang)
          : row.original.subjectName
        return <span>{displayName}</span>
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "departmentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.department} />
      ),
      meta: { label: t.department, variant: "text" },
      id: "departmentName",
      cell: ({ row }) => {
        const displayName = lang
          ? getLocalizedDepartmentName(row.original, lang)
          : row.original.departmentName
        return <span>{displayName}</span>
      },
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
        const subject = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(subject.id)

        const onDelete = () => {
          callbacks?.onDelete?.(subject)
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/subjects/${subject.id}`}>{t.view}</Link>
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

// NOTE: Do NOT export pre-generated columns. Always use getSubjectColumns()
// inside useMemo in client components to avoid SSR hook issues.
