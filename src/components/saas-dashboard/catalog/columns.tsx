"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface CatalogSubjectRow {
  id: string
  name: string
  slug: string
  department: string
  levels: string[]
  grades: number[]
  status: string
  totalChapters: number
  totalLessons: number
  usageCount: number
  color: string | null
  imageKey: string | null
}

export const catalogColumns: ColumnDef<CatalogSubjectRow>[] = [
  {
    accessorKey: "name",
    header: "Subject",
    cell: ({ row }) => {
      const { id, name, color } = row.original
      return (
        <Link
          href={`catalog/${id}`}
          className="flex max-w-[200px] items-center gap-2 truncate font-medium hover:underline"
        >
          {color && (
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {name}
        </Link>
      )
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <span className="block max-w-[140px] truncate">
        {row.original.department}
      </span>
    ),
  },
  {
    accessorKey: "grades",
    header: "Grades",
    cell: ({ row }) => {
      const grades = row.original.grades
      if (!grades.length)
        return <span className="text-muted-foreground">—</span>
      const sorted = [...grades].sort((a, b) => a - b)
      const label =
        sorted.length === 1
          ? `Grade ${sorted[0]}`
          : `Grade ${sorted[0]}–${sorted[sorted.length - 1]}`
      return (
        <Badge variant="secondary" className="text-xs">
          {label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const variant =
        status === "PUBLISHED"
          ? "default"
          : status === "DRAFT"
            ? "secondary"
            : "outline"
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "totalChapters",
    header: "Chapters",
    meta: { align: "center" as const },
  },
  {
    accessorKey: "totalLessons",
    header: "Lessons",
    meta: { align: "center" as const },
  },
  {
    accessorKey: "usageCount",
    header: "Schools",
    meta: { align: "center" as const },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`catalog/${id}`}>View Details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
