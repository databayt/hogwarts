"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  }
): ColumnDef<ClassroomRow>[] {
  const isAr = lang === "ar"

  return [
    {
      accessorKey: "roomName",
      header: isAr ? "اسم الغرفة" : "Room Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.roomName}</span>
      ),
    },
    {
      accessorKey: "typeName",
      header: isAr ? "النوع" : "Type",
    },
    {
      accessorKey: "capacity",
      header: isAr ? "السعة" : "Capacity",
    },
    {
      accessorKey: "classCount",
      header: isAr ? "الفصول" : "Classes",
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
              <Pencil className="mr-2 h-4 w-4" />
              {isAr ? "تعديل" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => callbacks.onDelete?.(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isAr ? "حذف" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
