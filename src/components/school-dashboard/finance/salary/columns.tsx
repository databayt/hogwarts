"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

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

export type SalaryStructureRow = {
  id: string
  teacherName: string
  teacherId: string
  employeeId: string | null
  baseSalary: number
  currency: string
  payFrequency: string
  allowanceCount: number
  deductionCount: number
  isActive: boolean
  effectiveFrom: string
  createdAt: string
}

const PAY_FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  BI_WEEKLY: "Bi-Weekly",
  WEEKLY: "Weekly",
  DAILY: "Daily",
}

const PAY_FREQUENCY_COLORS: Record<string, string> = {
  MONTHLY: "bg-blue-500/10 text-blue-500",
  BI_WEEKLY: "bg-purple-500/10 text-purple-500",
  WEEKLY: "bg-orange-500/10 text-orange-500",
  DAILY: "bg-gray-500/10 text-gray-500",
}

export const getSalaryStructureColumns = (
  lang?: string
): ColumnDef<SalaryStructureRow>[] => {
  return [
    {
      accessorKey: "teacherName",
      id: "teacherName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Teacher" />
      ),
      cell: ({ row }) => {
        const salary = row.original
        return (
          <Link
            href={`/${lang}/finance/salary/structures/${salary.id}`}
            className="font-medium hover:underline"
          >
            {salary.teacherName}
          </Link>
        )
      },
      meta: { label: "Teacher", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "employeeId",
      id: "employeeId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Employee ID" />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        return val ? (
          <span className="text-muted-foreground tabular-nums">{val}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      meta: { label: "Employee ID", variant: "text" },
    },
    {
      accessorKey: "baseSalary",
      id: "baseSalary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Base Salary" />
      ),
      cell: ({ row }) => {
        const salary = row.original
        return (
          <span className="text-end font-medium tabular-nums">
            {salary.currency === "USD" ? "$" : salary.currency}{" "}
            {salary.baseSalary.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        )
      },
      meta: { label: "Base Salary", variant: "text" },
    },
    {
      accessorKey: "payFrequency",
      id: "payFrequency",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pay Frequency" />
      ),
      cell: ({ getValue }) => {
        const freq = getValue<string>()
        const color =
          PAY_FREQUENCY_COLORS[freq] ?? "bg-gray-500/10 text-gray-500"
        const label = PAY_FREQUENCY_LABELS[freq] ?? freq
        return (
          <Badge variant="outline" className={color}>
            {label}
          </Badge>
        )
      },
      meta: {
        label: "Pay Frequency",
        variant: "select",
        options: [
          { label: "Monthly", value: "MONTHLY" },
          { label: "Bi-Weekly", value: "BI_WEEKLY" },
          { label: "Weekly", value: "WEEKLY" },
          { label: "Daily", value: "DAILY" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "allowanceCount",
      id: "allowanceCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Allowances" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
      meta: { label: "Allowances", variant: "text" },
    },
    {
      accessorKey: "deductionCount",
      id: "deductionCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Deductions" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
      meta: { label: "Deductions", variant: "text" },
    },
    {
      accessorKey: "isActive",
      id: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue }) => {
        const active = getValue<boolean>()
        return (
          <Badge
            variant="outline"
            className={
              active
                ? "bg-green-500/10 text-green-500"
                : "bg-gray-500/10 text-gray-500"
            }
          >
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
      accessorKey: "effectiveFrom",
      id: "effectiveFrom",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Effective From" />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: "Effective From", variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const salary = row.original
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
                <Link href={`/${lang}/finance/salary/structures/${salary.id}`}>
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/${lang}/finance/salary/structures/${salary.id}/edit`}
                >
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

// NOTE: Do NOT export pre-generated columns. Always use getSalaryStructureColumns()
// inside useMemo in client components to avoid SSR hook issues.
