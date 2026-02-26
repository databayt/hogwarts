"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { useParams } from "next/navigation"
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
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export interface CourseRow {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  price: number | null
  lang: string
  isPublished: boolean
  level: string
  status: string
  userId: string
  createdAt: Date
  updatedAt: Date
  category: { id: string; name: string } | null
  chapters: Array<{
    id: string
    lessons: Array<{ id: string }>
  }>
  _count: { chapters: number; enrollments: number }
}

export interface ColumnCallbacks {
  onEdit?: (course: CourseRow) => void
  onDelete?: (course: CourseRow) => void
}

export const getCourseColumns = (
  lang: string,
  callbacks?: ColumnCallbacks,
  dictionary?: any
): ColumnDef<CourseRow>[] => {
  const isRTL = lang === "ar"
  const t = dictionary?.stream?.adminCoursesColumns

  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.title || "Title"} />
      ),
      meta: { label: t?.title || "Title", variant: "text" as const },
      cell: ({ row }) => {
        const course = row.original
        return (
          <div className="max-w-[300px]">
            <span className="line-clamp-1 font-medium">{course.title}</span>
            {course.category && (
              <span className="text-muted-foreground block text-xs">
                {course.category.name}
              </span>
            )}
          </div>
        )
      },
      enableColumnFilter: true,
      filterFn: (row, id, filterValue: string) => {
        const title = row.original.title.toLowerCase()
        return title.includes(filterValue.toLowerCase())
      },
    },
    {
      accessorKey: "isPublished",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.status || "Status"} />
      ),
      cell: ({ getValue }) => {
        const published = getValue<boolean>()
        return (
          <Badge variant={published ? "default" : "outline"}>
            {published ? t?.published || "Published" : t?.draft || "Draft"}
          </Badge>
        )
      },
      meta: {
        label: t?.status || "Status",
        variant: "select" as const,
        options: [
          { label: t?.published || "Published", value: "true" },
          { label: t?.draft || "Draft", value: "false" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t?.price || "Price"} />
      ),
      cell: ({ getValue }) => {
        const price = getValue<number | null>()
        return (
          <span className="tabular-nums">
            {price ? `$${price}` : t?.free || "Free"}
          </span>
        )
      },
    },
    {
      id: "enrollments",
      accessorFn: (row) => row._count.enrollments,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.enrollments || "Enrollments"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      id: "chapters",
      accessorFn: (row) => row.chapters.length,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.chapters || "Chapters"}
        />
      ),
      cell: ({ row }) => {
        const chapters = row.original.chapters.length
        const lessons = row.original.chapters.reduce(
          (sum, ch) => sum + ch.lessons.length,
          0
        )
        return (
          <span className="text-muted-foreground text-xs tabular-nums">
            {chapters} / {lessons}
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.created || "Created"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<Date>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t?.actions || "Actions"}</span>,
      cell: function ActionsCell({ row }) {
        const course = row.original
        const params = useParams()
        const currentLang = (params?.lang as string) || lang
        const subdomain = params?.subdomain as string

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t?.openMenu || "Open menu"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t?.actions || "Actions"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => callbacks?.onEdit?.(course)}>
                {t?.editInfo || "Edit Info"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/${currentLang}/s/${subdomain}/stream/admin/courses/${course.id}/edit`}
                >
                  {t?.manageChapters || "Manage Chapters"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => callbacks?.onDelete?.(course)}>
                {t?.delete || "Delete"}
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
