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

export type ScholarshipRow = {
  id: string
  name: string
  coverageType: string
  coverageAmount: number
  academicYear: string
  startDate: string
  endDate: string
  maxBeneficiaries: number | null
  currentBeneficiaries: number
  applicationCount: number
  isActive: boolean
  createdAt: string
}

const COVERAGE_TYPE_COLORS: Record<string, string> = {
  FULL: "bg-green-500/10 text-green-500",
  PARTIAL: "bg-blue-500/10 text-blue-500",
  MERIT_BASED: "bg-purple-500/10 text-purple-500",
  NEED_BASED: "bg-orange-500/10 text-orange-500",
  SPORTS: "bg-cyan-500/10 text-cyan-500",
  ACADEMIC: "bg-indigo-500/10 text-indigo-500",
}

export const getScholarshipColumns = (
  lang?: string
): ColumnDef<ScholarshipRow>[] => {
  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const scholarship = row.original
        return (
          <Link
            href={`/${lang}/finance/fees/scholarships/${scholarship.id}`}
            className="font-medium hover:underline"
          >
            {scholarship.name}
          </Link>
        )
      },
      meta: { label: "Name", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "coverageType",
      id: "coverageType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ getValue }) => {
        const type = getValue<string>()
        const color = COVERAGE_TYPE_COLORS[type] ?? ""
        return (
          <Badge variant="outline" className={color}>
            {type.replace(/_/g, " ")}
          </Badge>
        )
      },
      meta: {
        label: "Type",
        variant: "select",
        options: [
          { label: "Full", value: "FULL" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Merit Based", value: "MERIT_BASED" },
          { label: "Need Based", value: "NEED_BASED" },
          { label: "Sports", value: "SPORTS" },
          { label: "Academic", value: "ACADEMIC" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "coverageAmount",
      id: "coverageAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Coverage Amount" />
      ),
      cell: ({ getValue }) => (
        <span className="text-end font-medium tabular-nums">
          {formatCurrency(getValue<number>(), (lang || "en") as Locale)}
        </span>
      ),
      meta: { label: "Coverage Amount", variant: "text" },
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
      accessorKey: "startDate",
      id: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: "Start Date", variant: "text" },
    },
    {
      accessorKey: "endDate",
      id: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: "End Date", variant: "text" },
    },
    {
      accessorKey: "currentBeneficiaries",
      id: "currentBeneficiaries",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Beneficiaries" />
      ),
      cell: ({ row }) => {
        const scholarship = row.original
        const max = scholarship.maxBeneficiaries
        return (
          <Badge variant="secondary" className="tabular-nums">
            <Users className="me-1 h-3 w-3" />
            {scholarship.currentBeneficiaries}
            {max !== null && ` / ${max}`}
          </Badge>
        )
      },
      meta: { label: "Beneficiaries", variant: "text" },
    },
    {
      accessorKey: "applicationCount",
      id: "applicationCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Applications" />
      ),
      cell: ({ getValue }) => (
        <Badge variant="outline" className="tabular-nums">
          {getValue<number>()}
        </Badge>
      ),
      meta: { label: "Applications", variant: "text" },
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
        const scholarship = row.original
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
                <Link
                  href={`/${lang}/finance/fees/scholarships/${scholarship.id}`}
                >
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/${lang}/finance/fees/scholarships/${scholarship.id}/edit`}
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

// NOTE: Do NOT export pre-generated columns. Always use getScholarshipColumns()
// inside useMemo in client components to avoid SSR hook issues.
