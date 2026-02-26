"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export type ClassroomRow = {
  id: string
  roomName: string
  capacity: number
  typeName: string
  typeId: string
  classCount: number
  timetableCount: number
  createdAt: string
}

export function getClassroomColumns(
  lang: string,
  callbacks: {
    onEdit?: (id: string) => void
    onDelete?: (row: ClassroomRow) => void
  },
  dictionary?: Record<string, string>
): ColumnDef<ClassroomRow>[] {
  const t = {
    roomName: dictionary?.roomName || "Room Name",
    type: dictionary?.type || "Type",
    capacity: dictionary?.capacity || "Capacity",
    classes: dictionary?.classes || "Classes",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
  }

  return [
    {
      accessorKey: "roomName",
      header: t.roomName,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.roomName}</span>
      ),
    },
    {
      accessorKey: "typeName",
      header: t.type,
    },
    {
      accessorKey: "capacity",
      header: t.capacity,
    },
    {
      accessorKey: "classCount",
      header: t.classes,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => callbacks.onEdit?.(row.original.id)}
            >
              <Pencil className="me-2 h-4 w-4" />
              {t.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => callbacks.onDelete?.(row.original)}
              className="text-destructive"
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
