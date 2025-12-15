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

export type ApplicationRow = {
  id: string
  applicationNumber: string
  applicantName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  applyingForClass: string
  status: string
  meritScore: string | null
  meritRank: number | null
  campaignName: string
  campaignId: string
  submittedAt: string | null
  createdAt: string
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "outline"
    case "SHORTLISTED":
    case "ENTRANCE_SCHEDULED":
    case "INTERVIEW_SCHEDULED":
      return "secondary"
    case "SELECTED":
    case "ADMITTED":
      return "default"
    case "WAITLISTED":
      return "outline"
    case "REJECTED":
    case "WITHDRAWN":
      return "destructive"
    default:
      return "outline"
  }
}

export const getApplicationColumns = (
  dictionary: Dictionary["school"]["admission"],
  locale: Locale
): ColumnDef<ApplicationRow>[] => {
  const t = dictionary

  return [
    {
      accessorKey: "applicationNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.applicationNumber || "Application #"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue<string>()}</span>
      ),
      meta: {
        label: t?.columns?.applicationNumber || "Application #",
        variant: "text",
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "applicantName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.applicant || "Applicant"}
        />
      ),
      meta: { label: t?.columns?.applicant || "Applicant", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "campaignName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.campaign || "Campaign"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {getValue<string>()}
        </span>
      ),
      meta: { label: t?.columns?.campaign || "Campaign", variant: "text" },
    },
    {
      accessorKey: "applyingForClass",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.class || "Class"}
        />
      ),
      meta: { label: t?.columns?.class || "Class", variant: "text" },
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
          { label: t?.status?.SUBMITTED || "Submitted", value: "SUBMITTED" },
          {
            label: t?.status?.UNDER_REVIEW || "Under Review",
            value: "UNDER_REVIEW",
          },
          {
            label: t?.status?.SHORTLISTED || "Shortlisted",
            value: "SHORTLISTED",
          },
          { label: t?.status?.SELECTED || "Selected", value: "SELECTED" },
          { label: t?.status?.WAITLISTED || "Waitlisted", value: "WAITLISTED" },
          { label: t?.status?.REJECTED || "Rejected", value: "REJECTED" },
          { label: t?.status?.ADMITTED || "Admitted", value: "ADMITTED" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "meritRank",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.meritRank || "Merit Rank"}
        />
      ),
      cell: ({ getValue }) => {
        const rank = getValue<number | null>()
        return rank ? (
          <span className="text-sm font-medium tabular-nums">#{rank}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.submitted || "Submitted"}
        />
      ),
      cell: ({ getValue }) => {
        const date = getValue<string | null>()
        return date ? (
          <span className="text-muted-foreground text-xs tabular-nums">
            {new Date(date).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">{t?.columns?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => {
        const application = row.original
        const router = useRouter()

        const onView = () => {
          router.push(`/admission/applications/${application.id}`)
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
              <DropdownMenuItem onClick={onView}>
                {t?.applications?.viewDetails || "View Details"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {t?.applications?.updateStatus || "Update Status"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {t?.applications?.sendEmail || "Send Email"}
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
