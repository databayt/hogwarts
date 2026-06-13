"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
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
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { updateApplicationStatus } from "./actions"

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
  applicationFeePaid: boolean
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

function ApplicationActionsCell({
  application,
  dictionary,
  locale,
}: {
  application: ApplicationRow
  dictionary: Dictionary["school"]["admission"]
  locale: Locale
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = dictionary

  const onView = () => {
    router.push(`/${locale}/admission/applications/${application.id}`)
  }

  const onUpdateStatus = (status: string) => {
    startTransition(async () => {
      const result = await updateApplicationStatus({
        id: application.id,
        status,
      })
      if (result.success) {
        SuccessToast(t?.applicationDetail?.statusUpdated || "Status updated")
        router.refresh()
      } else {
        ErrorToast(
          t?.applicationDetail?.statusUpdateFailed ||
            result.error ||
            "Failed to update status"
        )
      }
    })
  }

  const onSendEmail = () => {
    if (application.email) {
      window.open(`mailto:${application.email}`)
    }
  }

  // Must match VALID_TRANSITIONS in actions.ts
  const VALID_TRANSITIONS: Record<string, string[]> = {
    SUBMITTED: ["UNDER_REVIEW", "WITHDRAWN"],
    UNDER_REVIEW: ["SHORTLISTED", "REJECTED", "WITHDRAWN"],
    SHORTLISTED: ["SELECTED", "WAITLISTED", "REJECTED", "WITHDRAWN"],
    SELECTED: ["WAITLISTED", "REJECTED", "WITHDRAWN"],
    WAITLISTED: ["SELECTED", "REJECTED", "WITHDRAWN"],
    REJECTED: [],
    WITHDRAWN: [],
  }

  const allStatusOptions = [
    {
      value: "UNDER_REVIEW",
      label: t?.status?.UNDER_REVIEW || "Under Review",
    },
    {
      value: "SHORTLISTED",
      label: t?.status?.SHORTLISTED || "Shortlisted",
    },
    {
      value: "ENTRANCE_SCHEDULED",
      label: t?.status?.ENTRANCE_SCHEDULED || "Entrance Scheduled",
    },
    {
      value: "INTERVIEW_SCHEDULED",
      label: t?.status?.INTERVIEW_SCHEDULED || "Interview Scheduled",
    },
    { value: "SELECTED", label: t?.status?.SELECTED || "Selected" },
    { value: "WAITLISTED", label: t?.status?.WAITLISTED || "Waitlisted" },
    { value: "REJECTED", label: t?.status?.REJECTED || "Rejected" },
    { value: "WITHDRAWN", label: t?.status?.WITHDRAWN || "Withdrawn" },
  ]

  const statusOptions = allStatusOptions.filter((opt) =>
    VALID_TRANSITIONS[application.status]?.includes(opt.value)
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <Ellipsis className="h-4 w-4" />
          <span className="sr-only">{t?.toolbar?.openMenu || "Open menu"}</span>
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
        {statusOptions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              {t?.applications?.updateStatus || "Update Status"}
            </DropdownMenuLabel>
            {statusOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onUpdateStatus(opt.value)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSendEmail}>
          {t?.applications?.sendEmail || "Send Email"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
      // applicationFee column removed — applying is always free (2026-06-12 decision).
      // Registration fee appears only on the Enrollment tab.
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
          {
            label: t?.status?.ENTRANCE_SCHEDULED || "Entrance Scheduled",
            value: "ENTRANCE_SCHEDULED",
          },
          {
            label: t?.status?.INTERVIEW_SCHEDULED || "Interview Scheduled",
            value: "INTERVIEW_SCHEDULED",
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
            {new Date(date).toLocaleDateString(locale)}
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
      cell: ({ row }) => (
        <ApplicationActionsCell
          application={row.original}
          dictionary={dictionary}
          locale={locale}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
