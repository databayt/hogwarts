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
import { getAllowedTransitions } from "./status-machine"

export type ApplicationRow = {
  id: string
  applicationNumber: string
  /** AdmissionChannel — how this student entered. Every channel appears in
   *  this table; the Channel filter narrows to one. */
  channel: string
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
    case "EXPIRED":
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

  // Single source of truth — the same status machine the server action
  // validates against. A hand-duplicated map here had silently drifted
  // (ENTRANCE/INTERVIEW_SCHEDULED were missing, so staff couldn't select
  // them from this dropdown even though the server accepts them).
  const allowedTargets = getAllowedTransitions(application.status)

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
    allowedTargets.includes(opt.value)
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
      // How the student entered. PORTAL rows came through the reviewed
      // admit→offer→pay pipeline; every other channel is a direct admit whose
      // Application was minted by provisionStudent against the hidden system
      // campaign. All of them are listed here — this filter is what narrows
      // back to the review queue.
      //
      // Explicit `id` is REQUIRED for the facet to reach the URL: useDataTable
      // keys its nuqs parsers by `column.id`, and a ColumnDef with only an
      // `accessorKey` has none at that point — the filter would then narrow
      // only the rows already loaded (client-side) and never reach the
      // fetcher. Same convention as every `id: "status"` in listings/*.
      id: "channel",
      accessorKey: "channel",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.channel || "Channel"}
        />
      ),
      cell: ({ getValue }) => {
        const channel = getValue<string>()
        const label = t?.channel?.[channel as keyof typeof t.channel] || channel
        return (
          <Badge variant={channel === "PORTAL" ? "secondary" : "outline"}>
            {label}
          </Badge>
        )
      },
      meta: {
        label: t?.columns?.channel || "Channel",
        variant: "select",
        options: [
          { label: t?.channel?.PORTAL || "Portal", value: "PORTAL" },
          {
            label: t?.channel?.ADMIN_DIRECT || "Direct admission",
            value: "ADMIN_DIRECT",
          },
          {
            label: t?.channel?.ONBOARDING_IMPORT || "Onboarding import",
            value: "ONBOARDING_IMPORT",
          },
          {
            label: t?.channel?.BULK_IMPORT || "Bulk import",
            value: "BULK_IMPORT",
          },
          {
            label: t?.channel?.LEGACY_BACKFILL || "Legacy record",
            value: "LEGACY_BACKFILL",
          },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
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
