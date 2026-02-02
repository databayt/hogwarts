"use client"

import { useRouter } from "next/navigation"
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
          title={t?.campaigns?.campaignName || "Name"}
        />
      ),
      meta: { label: t?.campaigns?.campaignName || "Name", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.campaigns?.academicYear || "Year"}
        />
      ),
      meta: { label: t?.campaigns?.academicYear || "Year", variant: "text" },
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
          title={t?.nav?.applications || "Applications"}
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
          title={t?.campaigns?.totalSeats || "Seats"}
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
          title={t?.campaigns?.startDate || "Start"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.campaigns?.endDate || "End"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString()}
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
        const router = useRouter()
        const isRTL = locale === "ar"

        const handleView = () => {
          router.push(`/admission/campaigns/${campaign.id}`)
        }

        const handleViewApplications = () => {
          router.push(`/admission/applications?campaignId=${campaign.id}`)
        }

        const handleEdit = () => {
          onEdit?.(campaign.id)
        }

        const handleDelete = () => {
          if (
            window.confirm(
              isRTL
                ? "هل أنت متأكد من حذف هذه الحملة؟"
                : "Are you sure you want to delete this campaign?"
            )
          ) {
            onDelete?.(campaign.id)
          }
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {t?.columns?.actions || "Actions"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleView}>
                {t?.campaigns?.overview || "View Details"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleViewApplications}>
                {t?.campaigns?.viewAllApplications || "View Applications"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                {t?.campaigns?.editCampaign || "Edit"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
                disabled={campaign.applicationsCount > 0}
              >
                {isRTL ? "حذف" : "Delete"}
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
