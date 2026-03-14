"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis, Users } from "lucide-react"

import { formatCurrency } from "@/lib/i18n-format"
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
  lang?: string
): ColumnDef<FeeStructureRow>[] => {
  const isAr = lang === "ar"

  const t = {
    name: isAr ? "الاسم" : "Name",
    academicYear: isAr ? "العام الدراسي" : "Academic Year",
    class: isAr ? "الفصل" : "Class",
    allClasses: isAr ? "جميع الفصول" : "All Classes",
    totalAmount: isAr ? "المبلغ الإجمالي" : "Total Amount",
    installments: isAr ? "الأقساط" : "Installments",
    assignments: isAr ? "التعيينات" : "Assignments",
    status: isAr ? "الحالة" : "Status",
    active: isAr ? "نشط" : "Active",
    inactive: isAr ? "غير نشط" : "Inactive",
    created: isAr ? "تاريخ الإنشاء" : "Created",
    actions: isAr ? "إجراءات" : "Actions",
    view: isAr ? "عرض" : "View",
    edit: isAr ? "تعديل" : "Edit",
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.actions}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"}>
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/finance/fees/structures/${fee.id}`}>
                  {t.view}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/finance/fees/structures/${fee.id}/edit`}>
                  {t.edit}
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
