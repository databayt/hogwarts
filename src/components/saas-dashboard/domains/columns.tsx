"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type DomainRow = {
  id: string
  schoolName: string
  domain: string
  status: string
  createdAt?: string
}

export const domainColumns: ColumnDef<DomainRow>[] = [
  {
    accessorKey: "schoolName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="School" />
    ),
    meta: { label: "School", variant: "text", placeholder: "Search school" },
  },
  {
    accessorKey: "domain",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Domain" />
    ),
    meta: { label: "Domain", variant: "text", placeholder: "Search domain" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Verified", value: "verified" },
      ],
    },
    cell: ({ getValue }) => {
      const v = (getValue<string>() ?? "").toLowerCase()
      const variant =
        v === "verified"
          ? "default"
          : v === "approved"
            ? "secondary"
            : v === "rejected"
              ? "destructive"
              : "outline"
      const label = v.charAt(0).toUpperCase() + v.slice(1)
      return (
        <Badge
          variant={
            variant as "default" | "secondary" | "outline" | "destructive"
          }
        >
          {label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    meta: { label: "Created", variant: "text" },
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {(() => {
          const v = getValue<string | undefined>()
          return v ? new Date(v).toLocaleDateString() : "-"
        })()}
      </span>
    ),
  },
]
