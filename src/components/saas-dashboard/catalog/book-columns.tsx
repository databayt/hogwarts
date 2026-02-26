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

export interface CatalogBookRow {
  id: string
  title: string
  slug: string
  author: string
  genre: string
  isbn: string | null
  status: string
  approvalStatus: string
  usageCount: number
  coverColor: string
  rating: number
}

export const catalogBookColumns: ColumnDef<CatalogBookRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const { id, title, coverColor } = row.original
      return (
        <Link
          href={`catalog/books/${id}`}
          className="flex items-center gap-2 font-medium hover:underline"
        >
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: coverColor }}
          />
          {title}
        </Link>
      )
    },
  },
  {
    accessorKey: "author",
    header: "Author",
  },
  {
    accessorKey: "genre",
    header: "Genre",
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {row.original.genre}
      </Badge>
    ),
  },
  {
    accessorKey: "isbn",
    header: "ISBN",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.isbn || "—"}
      </span>
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
    accessorKey: "approvalStatus",
    header: "Approval",
    cell: ({ row }) => {
      const approval = row.original.approvalStatus
      const variant =
        approval === "APPROVED"
          ? "default"
          : approval === "PENDING"
            ? "secondary"
            : "destructive"
      return <Badge variant={variant}>{approval}</Badge>
    },
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
              <Link href={`catalog/books/${id}`}>View Details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
