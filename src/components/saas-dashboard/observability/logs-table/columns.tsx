"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type AuditRow = {
  id: string
  createdAt: string
  userEmail: string
  schoolName: string | null
  action: string
  reason: string | null
  ip?: string | null
  level?: string | null
  requestId?: string | null
}

export function getAuditColumns(dictionary?: any): ColumnDef<AuditRow>[] {
  const c = dictionary?.operator?.observability?.columns
  return [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.time || "Time"} />
      ),
      meta: { label: c?.time || "Time", variant: "dateRange" },
    },
    {
      accessorKey: "userEmail",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.user || "User"} />
      ),
      meta: { label: c?.user || "User", variant: "text", placeholder: "email" },
    },
    {
      accessorKey: "ip",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.ip || "IP"} />
      ),
      meta: { label: c?.ip || "IP", variant: "text", placeholder: "ip" },
    },
    {
      accessorKey: "schoolName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.school || "School"} />
      ),
      meta: { label: c?.school || "School", variant: "text" },
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.action || "Action"} />
      ),
      meta: { label: c?.action || "Action", variant: "text" },
    },
    {
      accessorKey: "level",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.level || "Level"} />
      ),
      meta: {
        label: c?.level || "Level",
        variant: "select",
        options: [
          { label: c?.info || "Info", value: "info" },
          { label: c?.warn || "Warn", value: "warn" },
          { label: c?.error || "Error", value: "error" },
        ],
      },
    },
    {
      accessorKey: "requestId",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={c?.requestId || "Request ID"}
        />
      ),
      meta: {
        label: c?.requestId || "Request ID",
        variant: "text",
        placeholder: "rid",
      },
    },
    {
      accessorKey: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.reason || "Reason"} />
      ),
      meta: { label: c?.reason || "Reason", variant: "text" },
    },
  ]
}

/** @deprecated Use getAuditColumns(dictionary) instead */
export const auditColumns: ColumnDef<AuditRow>[] = getAuditColumns()
