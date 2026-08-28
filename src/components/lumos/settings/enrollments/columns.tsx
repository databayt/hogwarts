"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { EnrollmentRecord } from "./actions"

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  PENDING: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
  EXPIRED: "destructive",
}

export interface EnrollmentColumnOptions {
  /** The `lumos` dictionary subtree — `enrollments.*` holds these labels. */
  dictionary: Record<string, any>
  /** Pre-built date formatter (one Intl instance for the whole table). */
  formatDate: (date: Date | string) => string
}

export function getEnrollmentColumns({
  dictionary,
  formatDate,
}: EnrollmentColumnOptions): ColumnDef<EnrollmentRecord>[] {
  const d = dictionary?.enrollments ?? {}

  return [
    {
      id: "student",
      accessorKey: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={d.student || "Student"} />
      ),
      meta: {
        label: d.student || "Student",
        variant: "text",
        placeholder: d.searchPlaceholder || "Search enrollments...",
      },
      enableColumnFilter: true,
      // The single toolbar search box covers student, email and subject — the
      // three things an admin actually types here. Every one of them is
      // nullable on the row, so guard before lowercasing.
      filterFn: (row, _id, filterValue: string) => {
        const needle = String(filterValue ?? "").toLowerCase()
        if (!needle) return true
        const { studentName, studentEmail, name } = row.original
        return [studentName, studentEmail, name].some((value) =>
          (value ?? "").toLowerCase().includes(needle)
        )
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.studentName ?? "—"}</span>
      ),
    },
    {
      accessorKey: "studentEmail",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={d.email || "Email"} />
      ),
      meta: { label: d.email || "Email" },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.studentEmail ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={d.subject || "Subject"} />
      ),
      meta: { label: d.subject || "Subject" },
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={d.status || "Status"} />
      ),
      meta: { label: d.status || "Status" },
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? "outline"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "completedLessons",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={d.completed || "Completed"}
        />
      ),
      meta: { label: d.completed || "Completed" },
      cell: ({ row }) => (
        <>
          {row.original.completedLessons} {d.lessons || "lessons"}
        </>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={d.enrolled || "Enrolled"}
        />
      ),
      meta: { label: d.enrolled || "Enrolled" },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ]
}
