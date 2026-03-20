"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"

export type ClassroomRow = {
  id: string
  roomName: string
  capacity: number
  typeName: string
  typeId: string
  gradeName: string | null
  gradeId: string | null
  classCount: number
  timetableCount: number
  createdAt: string
}

export function getClassroomColumns(
  lang: string,
  subdomain: string,
  callbacks: {
    onEdit?: (id: string) => void
    onDelete?: (row: ClassroomRow) => void
  },
  dictionary?: Record<string, string>
): ColumnDef<ClassroomRow>[] {
  const t = {
    roomName: dictionary?.roomName || "Room",
    type: dictionary?.type || "Type",
    grade: dictionary?.grade || "Grade",
    capacity: dictionary?.capacity || "Capacity",
    classes: dictionary?.classes || "Classes",
    shared: dictionary?.shared || "Shared",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
  }

  return [
    {
      accessorKey: "roomName",
      header: t.roomName,
      cell: ({ row }) => (
        <Link
          href={`/${lang}/classrooms/${row.original.id}`}
          className="text-primary font-medium hover:underline"
        >
          {row.original.roomName}
        </Link>
      ),
    },
    {
      accessorKey: "typeName",
      header: t.type,
    },
    {
      accessorKey: "gradeName",
      header: t.grade,
      cell: ({ row }) =>
        row.original.gradeName ? (
          <span>{row.original.gradeName}</span>
        ) : (
          <Badge variant="secondary">{t.shared}</Badge>
        ),
    },
    {
      accessorKey: "capacity",
      header: () => <div className="text-center">{t.capacity}</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.original.capacity}</div>
      ),
    },
    {
      accessorKey: "classCount",
      header: t.classes,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionMenu>
          <ActionMenuItem
            icon={Pencil}
            label={t.edit}
            onClick={() => callbacks.onEdit?.(row.original.id)}
          />
          <ActionMenuItem
            icon={Trash2}
            label={t.delete}
            variant="destructive"
            onClick={() => callbacks.onDelete?.(row.original)}
          />
        </ActionMenu>
      ),
    },
  ]
}
