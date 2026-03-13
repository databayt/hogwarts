"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis, Users } from "lucide-react"

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

import { STATUS_COLORS } from "./config"

export type FeeStructureRow = {
  id: string
  name: string
  academicYear: string
  className: string | null
  totalAmount: number
  installments: number
  assignmentCount: number
  isActive: boolean
  createdAt: string
}

export const getFeeStructureColumns = (
  lang?: string
): ColumnDef<FeeStructureRow>[] => {
  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const fee = row.original
        return (
          <Link
            href={`/${lang}/finance/fees/structures/${fee.id}`}
            className="font-medium hover:underline"
          >
            {fee.name}
          </Link>
        )
      },
      meta: { label: "Name", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "academicYear",
      id: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Academic Year" />
      ),
      meta: { label: "Academic Year", variant: "text" },
    },
    {
      accessorKey: "className",
      id: "className",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Class" />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        return val ? (
          <span>{val}</span>
        ) : (
          <Badge variant="outline">All Classes</Badge>
        )
      },
      meta: { label: "Class", variant: "text" },
    },
    {
      accessorKey: "totalAmount",
      id: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Amount" />
      ),
      cell: ({ getValue }) => (
        <span className="text-end font-medium tabular-nums">
          $
          {getValue<number>().toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
      meta: { label: "Total Amount", variant: "text" },
    },
    {
      accessorKey: "installments",
      id: "installments",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Installments" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
      meta: { label: "Installments", variant: "text" },
    },
    {
      accessorKey: "assignmentCount",
      id: "assignmentCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assignments" />
      ),
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="tabular-nums">
          <Users className="me-1 h-3 w-3" />
          {getValue<number>()}
        </Badge>
      ),
      meta: { label: "Assignments", variant: "text" },
    },
    {
      accessorKey: "isActive",
      id: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue }) => {
        const active = getValue<boolean>()
        const color = active ? STATUS_COLORS.ACTIVE : STATUS_COLORS.INACTIVE
        return (
          <Badge variant="outline" className={color}>
            {active ? "Active" : "Inactive"}
          </Badge>
        )
      },
      meta: {
        label: "Status",
        variant: "select",
        options: [
          { label: "Active", value: "true" },
          { label: "Inactive", value: "false" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: "Created", variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const fee = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/finance/fees/structures/${fee.id}`}>
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/finance/fees/structures/${fee.id}/edit`}>
                  Edit
                </Link>
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

// NOTE: Do NOT export pre-generated columns. Always use getFeeStructureColumns()
// inside useMemo in client components to avoid SSR hook issues.
