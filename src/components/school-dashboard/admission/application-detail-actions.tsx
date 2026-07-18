"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { confirmEnrollment, updateApplicationStatus } from "./actions"
import { getAllowedTransitions } from "./status-machine"
import { translateEnrollmentWarning } from "./warning-messages"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  applicationId: string
  currentStatus: string
  dictionary: Dictionary["school"]
  placement?: "sidebar" | "header"
  /**
   * Read-only posture (getUIConfigForRole — e.g. ACCOUNTANT): hide the
   * mutating controls instead of rendering buttons whose server actions
   * always reject with FORBIDDEN.
   */
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Status options
// ---------------------------------------------------------------------------

const ALL_STATUS_OPTIONS = [
  { value: "UNDER_REVIEW", fallback: "Under Review" },
  { value: "SHORTLISTED", fallback: "Shortlisted" },
  { value: "ENTRANCE_SCHEDULED", fallback: "Entrance Scheduled" },
  { value: "INTERVIEW_SCHEDULED", fallback: "Interview Scheduled" },
  { value: "SELECTED", fallback: "Selected" },
  { value: "WAITLISTED", fallback: "Waitlisted" },
  { value: "REJECTED", fallback: "Rejected" },
  { value: "WITHDRAWN", fallback: "Withdrawn" },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApplicationDetailActions({
  applicationId,
  currentStatus,
  dictionary,
  placement = "sidebar",
  readOnly = false,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = dictionary.admission

  // Only offer transitions the server will actually accept — terminal states
  // (REJECTED/WITHDRAWN/ADMITTED) yield an empty list, so no dead menu items.
  const allowedTargets = getAllowedTransitions(currentStatus)
  const statusOptions = ALL_STATUS_OPTIONS.filter((opt) =>
    allowedTargets.includes(opt.value)
  )

  const onUpdateStatus = (status: string) => {
    startTransition(async () => {
      const result = await updateApplicationStatus({
        id: applicationId,
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

  const onConfirmEnrollment = () => {
    startTransition(async () => {
      const result = await confirmEnrollment({ id: applicationId })
      if (result.success) {
        SuccessToast(
          t?.enrollment?.enrollmentConfirmed || "Enrollment confirmed"
        )
        for (const warning of result.data?.warnings ?? []) {
          const message = translateEnrollmentWarning(warning, t)
          if (message) WarningToast(message)
        }
        router.refresh()
      } else {
        ErrorToast(
          t?.applicationDetail?.statusUpdateFailed || result.error || "Failed"
        )
      }
    })
  }

  if (placement === "header") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.print()}
        className="h-9 w-9 print:hidden"
      >
        <Printer className="h-4 w-4" />
        <span className="sr-only">
          {t?.applicationDetail?.print || "Print"}
        </span>
      </Button>
    )
  }

  // Read-only roles get no mutating sidebar controls at all (print above
  // stays available — it isn't a mutation).
  if (readOnly) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 print:hidden">
      {statusOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isPending} className="h-9 w-52">
              {t?.applications?.updateStatus || "Update Status"}
              <ChevronDown className="ms-1.5 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {statusOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onUpdateStatus(opt.value)}
              >
                {t?.status?.[opt.value as keyof typeof t.status] ||
                  opt.fallback}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {currentStatus === "SELECTED" && (
        <Button
          variant="outline"
          onClick={onConfirmEnrollment}
          disabled={isPending}
          className="h-9 w-52"
        >
          {t?.enrollment?.confirmEnrollment || "Confirm Enrollment"}
        </Button>
      )}
    </div>
  )
}
