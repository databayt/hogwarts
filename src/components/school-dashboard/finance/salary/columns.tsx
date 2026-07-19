"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"

import { formatCurrency } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import type { Locale } from "@/components/internationalization/config"
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

const PAY_FREQUENCY_COLORS: Record<string, string> = {
  MONTHLY: "bg-blue-500/10 text-blue-500",
  BI_WEEKLY: "bg-purple-500/10 text-purple-500",
  WEEKLY: "bg-orange-500/10 text-orange-500",
  DAILY: "bg-gray-500/10 text-gray-500",
}

type SalaryColumnsDict = {
  teacher?: string
  employeeId?: string
  baseSalary?: string
  payFrequency?: string
  allowances?: string
  deductions?: string
  status?: string
  active?: string
  inactive?: string
  effectiveFrom?: string
  actions?: string
  view?: string
  edit?: string
  payFrequencyOptions?: Record<string, string>
}

export const getSalaryStructureColumns = (
  lang?: string,
  d?: SalaryColumnsDict
): ColumnDef<SalaryStructureRow>[] => {
  const isAr = lang === "ar"
  const freqLabels = d?.payFrequencyOptions || {}

  const t = {
    teacher: d?.teacher || "Teacher",
    employeeId: d?.employeeId || "Employee ID",
    baseSalary: d?.baseSalary || "Base Salary",
    payFrequency: d?.payFrequency || "Pay Frequency",
    allowances: d?.allowances || "Allowances",
    deductions: d?.deductions || "Deductions",
    status: d?.status || "Status",
    active: d?.active || "Active",
    inactive: d?.inactive || "Inactive",
    effectiveFrom: d?.effectiveFrom || "Effective From",
    actions: d?.actions || "Actions",
    view: d?.view || "View",
    edit: d?.edit || "Edit",
  }

  return [
    {
      accessorKey: "teacherName",
      id: "teacherName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.teacher} />
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
      meta: { label: t.teacher, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "employeeId",
      id: "employeeId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.employeeId} />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        return val ? (
          <span className="text-muted-foreground tabular-nums">{val}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      meta: { label: t.employeeId, variant: "text" },
    },
    {
      accessorKey: "baseSalary",
      id: "baseSalary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.baseSalary} />
      ),
      cell: ({ row }) => {
        const salary = row.original
        return (
          <span className="text-end font-medium tabular-nums">
            {formatCurrency(
              salary.baseSalary,
              (lang || "en") as Locale,
              salary.currency
            )}
          </span>
        )
      },
      meta: { label: t.baseSalary, variant: "text" },
    },
    {
      accessorKey: "payFrequency",
      id: "payFrequency",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.payFrequency} />
      ),
      cell: ({ getValue }) => {
        const freq = getValue<string>()
        const color =
          PAY_FREQUENCY_COLORS[freq] ?? "bg-gray-500/10 text-gray-500"
        const label = freqLabels[freq] ?? freq
        return (
          <Badge variant="outline" className={color}>
            {label}
          </Badge>
        )
      },
      meta: {
        label: t.payFrequency,
        variant: "select",
        options: [
          { label: freqLabels.MONTHLY || "Monthly", value: "MONTHLY" },
          { label: freqLabels.BI_WEEKLY || "Bi-Weekly", value: "BI_WEEKLY" },
          { label: freqLabels.WEEKLY || "Weekly", value: "WEEKLY" },
          { label: freqLabels.DAILY || "Daily", value: "DAILY" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "allowanceCount",
      id: "allowanceCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.allowances} />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
      meta: { label: t.allowances, variant: "text" },
    },
    {
      accessorKey: "deductionCount",
      id: "deductionCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.deductions} />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
      meta: { label: t.deductions, variant: "text" },
    },
    {
      accessorKey: "isActive",
      id: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
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
      accessorKey: "effectiveFrom",
      id: "effectiveFrom",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.effectiveFrom} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            isAr ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: t.effectiveFrom, variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const salary = row.original
        return (
          <ActionMenu align={isAr ? "start" : "end"}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.view}
              href={`/${lang}/finance/salary/structures/${salary.id}`}
            />
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getSalaryStructureColumns()
// inside useMemo in client components to avoid SSR hook issues.
