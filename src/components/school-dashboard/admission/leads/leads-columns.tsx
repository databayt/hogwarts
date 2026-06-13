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

import {
  markInquiryConverted,
  updateInquiryStatus,
  updateTourBookingStatus,
} from "./leads-actions"

// ============================================================================
// Extended dictionary type for the leads namespace
// (school.admission.leads.* keys are tracked in dict_keys output)
// ============================================================================

export type LeadsAdmissionDict = Dictionary["school"]["admission"] & {
  leads?: {
    title?: string
    description?: string
    tabs?: { inquiries?: string; tours?: string }
    searchInquiries?: string
    searchTours?: string
    export?: string
    noInquiries?: string
    noInquiriesDescription?: string
    noTourBookings?: string
    noTourBookingsDescription?: string
    statusUpdated?: string
    statusUpdateFailed?: string
    sendEmail?: string
    inquiryStatus?: {
      NEW?: string
      CONTACTED?: string
      QUALIFIED?: string
      CONVERTED?: string
      UNQUALIFIED?: string
    }
    bookingStatus?: {
      PENDING?: string
      CONFIRMED?: string
      COMPLETED?: string
      CANCELLED?: string
      NO_SHOW?: string
      RESCHEDULED?: string
    }
    sources?: {
      website?: string
      social?: string
      referral?: string
      advertisement?: string
    }
    columns?: {
      parentName?: string
      email?: string
      grade?: string
      source?: string
      followUp?: string
      received?: string
      bookingNumber?: string
      tourDate?: string
      attendees?: string
      location?: string
      booked?: string
    }
  }
}

// ============================================================================
// Row types
// ============================================================================

export type InquiryRow = {
  id: string
  parentName: string
  email: string
  phone: string | null
  studentName: string | null
  interestedGrade: string | null
  source: string | null
  status: string
  followUpDate: string | null
  assignedTo: string | null
  notes: string | null
  convertedToApplicationId: string | null
  createdAt: string
}

export type TourBookingRow = {
  id: string
  bookingNumber: string
  parentName: string
  email: string
  phone: string | null
  studentName: string | null
  interestedGrade: string | null
  status: string
  numberOfAttendees: number
  attendedAt: string | null
  cancelledAt: string | null
  slotDate: string | null
  slotStartTime: string | null
  slotEndTime: string | null
  slotLocation: string | null
  slotType: string | null
  createdAt: string
}

// ============================================================================
// Status styling helpers
// ============================================================================

function getInquiryStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "NEW":
      return "outline"
    case "CONTACTED":
      return "secondary"
    case "QUALIFIED":
      return "default"
    case "CONVERTED":
      return "default"
    case "UNQUALIFIED":
      return "destructive"
    default:
      return "outline"
  }
}

function getBookingStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PENDING":
      return "outline"
    case "CONFIRMED":
      return "secondary"
    case "COMPLETED":
      return "default"
    case "CANCELLED":
      return "destructive"
    case "NO_SHOW":
      return "destructive"
    case "RESCHEDULED":
      return "secondary"
    default:
      return "outline"
  }
}

// ============================================================================
// Inquiry action cell
// ============================================================================

function InquiryActionsCell({
  row,
  dictionary,
}: {
  row: InquiryRow
  dictionary: LeadsAdmissionDict
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = dictionary?.leads

  const onUpdateStatus = (
    status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "UNQUALIFIED"
  ) => {
    startTransition(async () => {
      const result = await updateInquiryStatus({ id: row.id, status })
      if (result.success) {
        SuccessToast(t?.statusUpdated || "Status updated")
        router.refresh()
      } else {
        ErrorToast(t?.statusUpdateFailed || "Failed to update status")
      }
    })
  }

  const statusOptions: {
    value: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "UNQUALIFIED"
    label: string
  }[] = [
    { value: "NEW", label: t?.inquiryStatus?.NEW || "New" },
    { value: "CONTACTED", label: t?.inquiryStatus?.CONTACTED || "Contacted" },
    { value: "QUALIFIED", label: t?.inquiryStatus?.QUALIFIED || "Qualified" },
    {
      value: "UNQUALIFIED",
      label: t?.inquiryStatus?.UNQUALIFIED || "Unqualified",
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <Ellipsis className="h-4 w-4" />
          <span className="sr-only">
            {dictionary?.toolbar?.openMenu || "Open menu"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {dictionary?.columns?.actions || "Actions"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statusOptions
          .filter((opt) => opt.value !== row.status)
          .map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onUpdateStatus(opt.value)}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            if (row.email) window.open(`mailto:${row.email}`)
          }}
        >
          {t?.sendEmail || "Send Email"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Tour booking action cell
// ============================================================================

function TourBookingActionsCell({
  row,
  dictionary,
}: {
  row: TourBookingRow
  dictionary: LeadsAdmissionDict
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = dictionary?.leads

  const onUpdateStatus = (
    status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  ) => {
    startTransition(async () => {
      const result = await updateTourBookingStatus({ id: row.id, status })
      if (result.success) {
        SuccessToast(t?.statusUpdated || "Status updated")
        router.refresh()
      } else {
        ErrorToast(t?.statusUpdateFailed || "Failed to update status")
      }
    })
  }

  const availableStatuses = (
    [
      { value: "CONFIRMED", label: t?.bookingStatus?.CONFIRMED || "Confirm" },
      {
        value: "COMPLETED",
        label: t?.bookingStatus?.COMPLETED || "Mark Completed",
      },
      { value: "NO_SHOW", label: t?.bookingStatus?.NO_SHOW || "Mark No Show" },
      { value: "CANCELLED", label: t?.bookingStatus?.CANCELLED || "Cancel" },
    ] as const
  ).filter((opt) => opt.value !== row.status)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <Ellipsis className="h-4 w-4" />
          <span className="sr-only">
            {dictionary?.toolbar?.openMenu || "Open menu"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {dictionary?.columns?.actions || "Actions"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableStatuses.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onUpdateStatus(opt.value)}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            if (row.email) window.open(`mailto:${row.email}`)
          }}
        >
          {t?.sendEmail || "Send Email"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Column definitions
// ============================================================================

export function getInquiryColumns(
  dictionary: LeadsAdmissionDict,
  locale: Locale
): ColumnDef<InquiryRow>[] {
  const t = dictionary?.leads
  const col = dictionary?.columns

  return [
    {
      accessorKey: "parentName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.parentName || "Contact"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
      meta: { label: t?.columns?.parentName || "Contact", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.email || "Email"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {getValue<string>()}
        </span>
      ),
      meta: { label: t?.columns?.email || "Email", variant: "text" },
    },
    {
      accessorKey: "interestedGrade",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.grade || "Grade"}
        />
      ),
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return v ? (
          <span className="text-sm">{v}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      meta: { label: t?.columns?.grade || "Grade", variant: "text" },
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.source || "Source"}
        />
      ),
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return v ? (
          <Badge variant="outline" className="text-xs capitalize">
            {v}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      meta: {
        label: t?.columns?.source || "Source",
        variant: "select",
        options: [
          { label: t?.sources?.website || "Website", value: "website" },
          { label: t?.sources?.social || "Social", value: "social" },
          { label: t?.sources?.referral || "Referral", value: "referral" },
          {
            label: t?.sources?.advertisement || "Advertisement",
            value: "advertisement",
          },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.status || "Status"}
        />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        const label =
          t?.inquiryStatus?.[status as keyof typeof t.inquiryStatus] || status
        return <Badge variant={getInquiryStatusVariant(status)}>{label}</Badge>
      },
      meta: {
        label: col?.status || "Status",
        variant: "select",
        options: [
          { label: t?.inquiryStatus?.NEW || "New", value: "NEW" },
          {
            label: t?.inquiryStatus?.CONTACTED || "Contacted",
            value: "CONTACTED",
          },
          {
            label: t?.inquiryStatus?.QUALIFIED || "Qualified",
            value: "QUALIFIED",
          },
          {
            label: t?.inquiryStatus?.CONVERTED || "Converted",
            value: "CONVERTED",
          },
          {
            label: t?.inquiryStatus?.UNQUALIFIED || "Unqualified",
            value: "UNQUALIFIED",
          },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "followUpDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.followUp || "Follow Up"}
        />
      ),
      cell: ({ getValue }) => {
        const d = getValue<string | null>()
        if (!d) return <span className="text-muted-foreground">-</span>
        const date = new Date(d)
        const isPast = date < new Date()
        return (
          <span
            className={
              isPast
                ? "text-destructive text-xs tabular-nums"
                : "text-muted-foreground text-xs tabular-nums"
            }
          >
            {date.toLocaleDateString(locale)}
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.received || "Received"}
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
        <span className="sr-only">{col?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => (
        <InquiryActionsCell row={row.original} dictionary={dictionary} />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

export function getTourBookingColumns(
  dictionary: LeadsAdmissionDict,
  locale: Locale
): ColumnDef<TourBookingRow>[] {
  const t = dictionary?.leads
  const col = dictionary?.columns

  return [
    {
      accessorKey: "bookingNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.bookingNumber || "Booking #"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue<string>()}</span>
      ),
      meta: {
        label: t?.columns?.bookingNumber || "Booking #",
        variant: "text",
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "parentName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.parentName || "Contact"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
      meta: { label: t?.columns?.parentName || "Contact", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "slotDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.tourDate || "Tour Date"}
        />
      ),
      cell: ({ row }) => {
        const d = row.original.slotDate
        const start = row.original.slotStartTime
        const end = row.original.slotEndTime
        if (!d) return <span className="text-muted-foreground">-</span>
        return (
          <div className="text-sm">
            <div className="font-medium">
              {new Date(d).toLocaleDateString(locale)}
            </div>
            {start && end && (
              <div className="text-muted-foreground text-xs">
                {start} – {end}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "numberOfAttendees",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.attendees || "Attendees"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.status || "Status"}
        />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        const label =
          t?.bookingStatus?.[status as keyof typeof t.bookingStatus] || status
        return <Badge variant={getBookingStatusVariant(status)}>{label}</Badge>
      },
      meta: {
        label: col?.status || "Status",
        variant: "select",
        options: [
          { label: t?.bookingStatus?.PENDING || "Pending", value: "PENDING" },
          {
            label: t?.bookingStatus?.CONFIRMED || "Confirmed",
            value: "CONFIRMED",
          },
          {
            label: t?.bookingStatus?.COMPLETED || "Completed",
            value: "COMPLETED",
          },
          {
            label: t?.bookingStatus?.CANCELLED || "Cancelled",
            value: "CANCELLED",
          },
          {
            label: t?.bookingStatus?.NO_SHOW || "No Show",
            value: "NO_SHOW",
          },
          {
            label: t?.bookingStatus?.RESCHEDULED || "Rescheduled",
            value: "RESCHEDULED",
          },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "slotLocation",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.location || "Location"}
        />
      ),
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return v ? (
          <span className="text-muted-foreground text-sm">{v}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.booked || "Booked"}
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
        <span className="sr-only">{col?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => (
        <TourBookingActionsCell row={row.original} dictionary={dictionary} />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
