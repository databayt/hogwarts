"use client"

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
  callbacks?: ColumnCallbacks
): ColumnDef<CourseRow>[] => {
  const isRTL = lang === "ar"

  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={isRTL ? "العنوان" : "Title"}
        />
      ),
      meta: { label: isRTL ? "العنوان" : "Title", variant: "text" as const },
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
        <DataTableColumnHeader
          column={column}
          title={isRTL ? "الحالة" : "Status"}
        />
      ),
      cell: ({ getValue }) => {
        const published = getValue<boolean>()
        return (
          <Badge variant={published ? "default" : "outline"}>
            {published
              ? isRTL
                ? "منشور"
                : "Published"
              : isRTL
                ? "مسودة"
                : "Draft"}
          </Badge>
        )
      },
      meta: {
        label: isRTL ? "الحالة" : "Status",
        variant: "select" as const,
        options: [
          { label: isRTL ? "منشور" : "Published", value: "true" },
          { label: isRTL ? "مسودة" : "Draft", value: "false" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={isRTL ? "السعر" : "Price"}
        />
      ),
      cell: ({ getValue }) => {
        const price = getValue<number | null>()
        return (
          <span className="tabular-nums">
            {price ? `$${price}` : isRTL ? "مجاني" : "Free"}
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
          title={isRTL ? "المسجلين" : "Enrollments"}
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
          title={isRTL ? "الفصول" : "Chapters"}
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
          title={isRTL ? "التاريخ" : "Created"}
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
      header: () => (
        <span className="sr-only">{isRTL ? "الإجراءات" : "Actions"}</span>
      ),
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
                <span className="sr-only">
                  {isRTL ? "فتح القائمة" : "Open menu"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {isRTL ? "الإجراءات" : "Actions"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => callbacks?.onEdit?.(course)}>
                {isRTL ? "تعديل المعلومات" : "Edit Info"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/${currentLang}/s/${subdomain}/stream/admin/courses/${course.id}/edit`}
                >
                  {isRTL ? "إدارة الفصول" : "Manage Chapters"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => callbacks?.onDelete?.(course)}>
                {isRTL ? "حذف" : "Delete"}
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
