"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Clock, Ellipsis, X } from "lucide-react"
import { toast } from "sonner"

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

import { confirmEnrollment, recordPayment } from "./actions"

export type EnrollmentRow = {
  id: string
  applicationNumber: string
  applicantName: string
  firstName: string
  lastName: string
  applyingForClass: string
  status: string
  meritRank: number | null
  admissionOffered: boolean
  offerDate: string | null
  offerExpiryDate: string | null
  admissionConfirmed: boolean
  confirmationDate: string | null
  applicationFeePaid: boolean
  paymentDate: string | null
  hasDocuments: boolean
  campaignName: string
  campaignId: string
}

const getOfferBadge = (
  row: EnrollmentRow,
  t: Dictionary["school"]["admission"]
) => {
  if (row.admissionConfirmed) {
    return {
      label: t?.enrollment?.accepted || "Accepted",
      variant: "default" as const,
      icon: Check,
    }
  }
  if (row.admissionOffered) {
    const isExpired =
      row.offerExpiryDate && new Date(row.offerExpiryDate) < new Date()
    if (isExpired) {
      return {
        label: t?.enrollment?.expired || "Expired",
        variant: "destructive" as const,
        icon: X,
      }
    }
    return {
      label: t?.enrollment?.pending || "Pending",
      variant: "outline" as const,
      icon: Clock,
    }
  }
  return {
    label: t?.enrollment?.pendingOffer || "Not Offered",
    variant: "secondary" as const,
    icon: null,
  }
}

export const getEnrollmentColumns = (
  dictionary: Dictionary["school"]["admission"],
  locale: Locale
): ColumnDef<EnrollmentRow>[] => {
  const t = dictionary

  return [
    {
      accessorKey: "meritRank",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.meritRank || "Rank"}
        />
      ),
      cell: ({ getValue }) => {
        const rank = getValue<number | null>()
        return rank ? (
          <span className="font-semibold tabular-nums">#{rank}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
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
      accessorKey: "applicationNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.applicationNumber || "Application #"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "applyingForClass",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.class || "Class"}
        />
      ),
    },
    {
      id: "offerStatus",
      accessorFn: (row) =>
        row.admissionConfirmed
          ? "accepted"
          : row.admissionOffered
            ? "pending"
            : "not_offered",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.offerStatus || "Offer"}
        />
      ),
      cell: ({ row }) => {
        const badge = getOfferBadge(row.original, t)
        return (
          <Badge variant={badge.variant} className="gap-1">
            {badge.icon && <badge.icon className="h-3 w-3" />}
            {badge.label}
          </Badge>
        )
      },
      meta: {
        label: t?.columns?.offerStatus || "Offer Status",
        variant: "select",
        options: [
          { label: t?.enrollment?.accepted || "Accepted", value: "accepted" },
          { label: t?.enrollment?.pending || "Pending", value: "pending" },
          {
            label: t?.enrollment?.pendingOffer || "Not Offered",
            value: "not_offered",
          },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "applicationFeePaid",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.fees || "Fees"}
        />
      ),
      cell: ({ getValue }) => {
        const paid = getValue<boolean>()
        return (
          <Badge variant={paid ? "default" : "outline"}>
            {paid
              ? t?.enrollment?.paid || "Paid"
              : t?.enrollment?.unpaid || "Unpaid"}
          </Badge>
        )
      },
      meta: {
        label: t?.columns?.fees || "Fees",
        variant: "select",
        options: [
          { label: t?.enrollment?.paid || "Paid", value: "true" },
          { label: t?.enrollment?.unpaid || "Unpaid", value: "false" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
    },
    {
      accessorKey: "hasDocuments",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.documents || "Documents"}
        />
      ),
      cell: ({ getValue }) => {
        const has = getValue<boolean>()
        return (
          <Badge variant={has ? "default" : "outline"}>
            {has
              ? t?.enrollment?.verified || "Verified"
              : t?.enrollment?.inProgress || "Pending"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">{t?.columns?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => {
        const enrollment = row.original
        const router = useRouter()
        const [isPending, startTransition] = useTransition()

        const onView = () => {
          router.push(`/admission/applications/${enrollment.id}`)
        }

        const onRecordPayment = () => {
          startTransition(async () => {
            const result = await recordPayment({
              id: enrollment.id,
              paymentId: `CASH-${Date.now()}`,
            })
            if (result.success) {
              toast.success(
                t?.enrollment?.paymentRecorded || "Payment recorded"
              )
            } else {
              toast.error(result.error || "Failed to record payment")
            }
          })
        }

        const onConfirmEnrollment = () => {
          startTransition(async () => {
            const result = await confirmEnrollment({ id: enrollment.id })
            if (result.success) {
              toast.success(
                t?.enrollment?.enrollmentConfirmed || "Enrollment confirmed"
              )
            } else {
              toast.error(result.error || "Failed to confirm enrollment")
            }
          })
        }

        const onVerifyDocuments = () => {
          router.push(`/admission/applications/${enrollment.id}`)
        }

        const onSendReminder = () => {
          const name = enrollment.applicantName || enrollment.firstName
          const subject = encodeURIComponent(
            `Enrollment Reminder - ${enrollment.applicationNumber}`
          )
          const body = encodeURIComponent(
            `Dear ${name},\n\nThis is a reminder regarding your enrollment application (${enrollment.applicationNumber}).\n\nPlease complete any outstanding steps at your earliest convenience.\n\nThank you.`
          )
          window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isPending}
              >
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
              {!enrollment.applicationFeePaid && (
                <DropdownMenuItem
                  onClick={onRecordPayment}
                  disabled={isPending}
                >
                  {t?.enrollment?.recordPayment || "Record Payment"}
                </DropdownMenuItem>
              )}
              {!enrollment.hasDocuments && (
                <DropdownMenuItem onClick={onVerifyDocuments}>
                  {t?.enrollment?.verifyDocuments || "Verify Documents"}
                </DropdownMenuItem>
              )}
              {enrollment.admissionOffered &&
                !enrollment.admissionConfirmed && (
                  <DropdownMenuItem
                    onClick={onConfirmEnrollment}
                    disabled={isPending}
                  >
                    {t?.enrollment?.confirmEnrollment || "Confirm Enrollment"}
                  </DropdownMenuItem>
                )}
              <DropdownMenuItem onClick={onSendReminder}>
                {t?.enrollment?.sendReminder || "Send Reminder"}
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
