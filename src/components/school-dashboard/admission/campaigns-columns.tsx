"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { confirmDeleteDialog } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type CampaignRow = {
  id: string
  name: string
  academicYear: string
  startDate: string
  endDate: string
  status: string
  totalSeats: number
  applicationFee: string | null
  applicationsCount: number
  createdAt: string
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "OPEN":
      return "default"
    case "DRAFT":
      return "outline"
    case "CLOSED":
      return "secondary"
    case "PROCESSING":
      return "default"
    case "COMPLETED":
      return "secondary"
    default:
      return "outline"
  }
}

export const getCampaignColumns = (
  dictionary: Dictionary["school"]["admission"],
  locale: Locale,
  options?: {
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
  }
): ColumnDef<CampaignRow>[] => {
  const t = dictionary
  const { onEdit, onDelete } = options ?? {}

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.name || "Name"}
        />
      ),
      meta: { label: t?.columns?.name || "Name", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.year || "Year"}
        />
      ),
      meta: { label: t?.columns?.year || "Year", variant: "text" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.status || "Status"}
        />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        const label = t?.status?.[status as keyof typeof t.status] || status
        return <Badge variant={getStatusVariant(status)}>{label}</Badge>
      },
      meta: {
        label: t?.columns?.status || "Status",
        variant: "select",
        options: [
          { label: t?.status?.DRAFT || "Draft", value: "DRAFT" },
          { label: t?.status?.OPEN || "Open", value: "OPEN" },
          { label: t?.status?.CLOSED || "Closed", value: "CLOSED" },
          { label: t?.status?.PROCESSING || "Processing", value: "PROCESSING" },
          { label: t?.status?.COMPLETED || "Completed", value: "COMPLETED" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "applicationsCount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.applications || "Applications"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "totalSeats",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.seats || "Seats"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.start || "Start"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(locale)}
        </span>
      ),
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.end || "End"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(locale)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">{t?.columns?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => {
        const campaign = row.original
        const isRTL = locale === "ar"

        const handleEdit = () => {
          onEdit?.(campaign.id)
        }

        const handleDelete = async () => {
          const confirmed = await confirmDeleteDialog(undefined, {
            title: t?.campaigns?.deleteCampaign || "Delete Campaign",
            description:
              t?.campaigns?.deleteConfirm ||
              "Are you sure? This action cannot be undone.",
            confirmText: undefined,
            cancelText: undefined,
          })
          if (confirmed) onDelete?.(campaign.id)
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">
                  {t?.toolbar?.openMenu || "Open menu"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                {t?.campaigns?.editCampaign || "Edit"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
                disabled={campaign.applicationsCount > 0}
              >
                {t?.campaigns?.deleteCampaign || "Delete"}
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
