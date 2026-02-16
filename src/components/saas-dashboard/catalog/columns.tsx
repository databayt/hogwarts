"use client"

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
          className="flex items-center gap-2 font-medium hover:underline"
        >
          {color && (
            <span
              className="inline-block h-3 w-3 rounded-full"
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
  },
  {
    accessorKey: "levels",
    header: "Levels",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.levels.map((level) => (
          <Badge key={level} variant="secondary" className="text-xs">
            {level}
          </Badge>
        ))}
      </div>
    ),
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
  },
  {
    accessorKey: "totalLessons",
    header: "Lessons",
  },
  {
    accessorKey: "usageCount",
    header: "Schools",
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
