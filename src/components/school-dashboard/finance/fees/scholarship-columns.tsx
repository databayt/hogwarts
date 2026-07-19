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
  lang?: string,
  col?: Record<string, string>,
  callbacks?: { onDelete?: (row: ScholarshipRow) => void },
  currency: string = "USD"
): ColumnDef<ScholarshipRow>[] => {
  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={col?.name || "Name"} />
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
      meta: { label: col?.name || "Name", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "coverageType",
      id: "coverageType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={col?.type || "Type"} />
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
        label: col?.type || "Type",
        variant: "select",
        options: [
          { label: col?.full || "Full", value: "FULL" },
          { label: col?.partial || "Partial", value: "PARTIAL" },
          { label: col?.meritBased || "Merit Based", value: "MERIT_BASED" },
          { label: col?.needBased || "Need Based", value: "NEED_BASED" },
          { label: col?.sports || "Sports", value: "SPORTS" },
          { label: col?.academic || "Academic", value: "ACADEMIC" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "coverageAmount",
      id: "coverageAmount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.coverageAmount || "Coverage Amount"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-end font-medium tabular-nums">
          {formatCurrency(
            getValue<number>(),
            (lang || "en") as Locale,
            currency
          )}
        </span>
      ),
      meta: {
        label: col?.coverageAmount || "Coverage Amount",
        variant: "text",
      },
    },
    {
      accessorKey: "academicYear",
      id: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.academicYear || "Academic Year"}
        />
      ),
      meta: { label: col?.academicYear || "Academic Year", variant: "text" },
    },
    {
      accessorKey: "startDate",
      id: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.startDate || "Start Date"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: col?.startDate || "Start Date", variant: "text" },
    },
    {
      accessorKey: "endDate",
      id: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.endDate || "End Date"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: col?.endDate || "End Date", variant: "text" },
    },
    {
      accessorKey: "currentBeneficiaries",
      id: "currentBeneficiaries",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.beneficiaries || "Beneficiaries"}
        />
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
      meta: { label: col?.beneficiaries || "Beneficiaries", variant: "text" },
    },
    {
      accessorKey: "applicationCount",
      id: "applicationCount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.applications || "Applications"}
        />
      ),
      cell: ({ getValue }) => (
        <Badge variant="outline" className="tabular-nums">
          {getValue<number>()}
        </Badge>
      ),
      meta: { label: col?.applications || "Applications", variant: "text" },
    },
    {
      accessorKey: "isActive",
      id: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.status || "Status"}
        />
      ),
      cell: ({ getValue }) => {
        const active = getValue<boolean>()
        const color = active ? STATUS_COLORS.ACTIVE : STATUS_COLORS.INACTIVE
        return (
          <Badge variant="outline" className={color}>
            {active ? col?.active || "Active" : col?.inactive || "Inactive"}
          </Badge>
        )
      },
      meta: {
        label: col?.status || "Status",
        variant: "select",
        options: [
          { label: col?.active || "Active", value: "true" },
          { label: col?.inactive || "Inactive", value: "false" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.created || "Created"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: col?.created || "Created", variant: "text" },
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">{col?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => {
        const scholarship = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{col?.actions || "Actions"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{col?.actions || "Actions"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/${lang}/finance/fees/scholarships/${scholarship.id}`}
                >
                  {col?.view || "View"}
                </Link>
              </DropdownMenuItem>
              {callbacks?.onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => callbacks.onDelete!(scholarship)}
                    className="text-destructive focus:text-destructive"
                  >
                    {col?.delete || "Delete"}
                  </DropdownMenuItem>
                </>
              )}
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
