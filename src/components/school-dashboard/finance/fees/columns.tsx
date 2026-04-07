"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Users } from "lucide-react"

import { formatCurrency } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import type { Locale } from "@/components/internationalization/config"
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
  lang?: string,
  col?: Record<string, string>,
  actions?: {
    onToggleActive?: (id: string) => void
    onDelete?: (id: string) => void
  }
): ColumnDef<FeeStructureRow>[] => {
  const isAr = lang === "ar"

  const t = {
    name: col?.name || "Name",
    academicYear: col?.academicYear || "Academic Year",
    class: col?.class || "Class",
    allClasses: col?.allClasses || "All Classes",
    totalAmount: col?.totalAmount || "Total Amount",
    installments: col?.installments || "Installments",
    assignments: col?.assignments || "Assignments",
    status: col?.status || "Status",
    active: col?.active || "Active",
    inactive: col?.inactive || "Inactive",
    created: col?.created || "Created",
    actions: col?.actions || "Actions",
    view: col?.view || "View",
    edit: col?.edit || "Edit",
    deactivate: col?.deactivate || "Deactivate",
    activate: col?.activate || "Activate",
    delete: col?.delete || "Delete",
  }

  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
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
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "academicYear",
      id: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.academicYear} />
      ),
      meta: { label: t.academicYear, variant: "text" },
    },
    {
      accessorKey: "className",
      id: "className",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.class} />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        return val ? (
          <span>{val}</span>
        ) : (
          <Badge variant="outline">{t.allClasses}</Badge>
        )
      },
      meta: { label: t.class, variant: "text" },
    },
    {
      accessorKey: "totalAmount",
      id: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.totalAmount} />
      ),
      cell: ({ getValue }) => (
        <span className="text-end font-medium tabular-nums">
          {formatCurrency(getValue<number>(), (lang || "en") as Locale)}
        </span>
      ),
      meta: { label: t.totalAmount, variant: "text" },
    },
    {
      accessorKey: "installments",
      id: "installments",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.installments} />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
      meta: { label: t.installments, variant: "text" },
    },
    {
      accessorKey: "assignmentCount",
      id: "assignmentCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.assignments} />
      ),
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="tabular-nums">
          <Users className="me-1 h-3 w-3" />
          {getValue<number>()}
        </Badge>
      ),
      meta: { label: t.assignments, variant: "text" },
    },
    {
      accessorKey: "isActive",
      id: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ getValue }) => {
        const active = getValue<boolean>()
        const color = active ? STATUS_COLORS.ACTIVE : STATUS_COLORS.INACTIVE
        return (
          <Badge variant="outline" className={color}>
            {active ? t.active : t.inactive}
          </Badge>
        )
      },
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: "true" },
          { label: t.inactive, value: "false" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            isAr ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: t.created, variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const fee = row.original
        return (
          <ActionMenu align={isAr ? "start" : "end"}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.view}
              href={`/${lang}/finance/fees/structures/${fee.id}`}
            />
            <ActionMenuItem
              label={t.edit}
              href={`/${lang}/finance/fees/structures/${fee.id}`}
            />
            {actions?.onToggleActive && (
              <ActionMenuItem
                label={fee.isActive ? t.deactivate : t.activate}
                onClick={() => actions.onToggleActive!(fee.id)}
              />
            )}
            {actions?.onDelete && (
              <ActionMenuItem
                label={t.delete}
                variant="destructive"
                onClick={() => actions.onDelete!(fee.id)}
              />
            )}
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getFeeStructureColumns()
// inside useMemo in client components to avoid SSR hook issues.
