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
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { confirmEnrollment, updateApplicationStatus } from "./actions"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  applicationId: string
  currentStatus: string
  dictionary: Dictionary["school"]
  placement?: "sidebar" | "header"
}

// ---------------------------------------------------------------------------
// Status options
// ---------------------------------------------------------------------------

const ALL_STATUS_OPTIONS = [
  { value: "UNDER_REVIEW", fallback: "Under Review" },
  { value: "SHORTLISTED", fallback: "Shortlisted" },
  { value: "SELECTED", fallback: "Selected" },
  { value: "WAITLISTED", fallback: "Waitlisted" },
  { value: "REJECTED", fallback: "Rejected" },
  { value: "WITHDRAWN", fallback: "Withdrawn" },
] as const

const ALL_STATUSES = ALL_STATUS_OPTIONS.map((o) => o.value)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApplicationDetailActions({
  applicationId,
  currentStatus,
  dictionary,
  placement = "sidebar",
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = dictionary.admission

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
          result.error ||
            t?.applicationDetail?.statusUpdateFailed ||
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
        router.refresh()
      } else {
        ErrorToast(
          result.error || t?.applicationDetail?.statusUpdateFailed || "Failed"
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
        className="h-9 w-9"
      >
        <Printer className="h-4 w-4" />
        <span className="sr-only">
          {t?.applicationDetail?.print || "Print"}
        </span>
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isPending}
            className="h-9 w-52 bg-[#0969da] text-white hover:bg-[#0969da]/90"
          >
            {t?.applications?.updateStatus || "Update Status"}
            <ChevronDown className="ms-1.5 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {ALL_STATUS_OPTIONS.filter((opt) => opt.value !== currentStatus).map(
            (opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onUpdateStatus(opt.value)}
              >
                {t?.status?.[opt.value as keyof typeof t.status] ||
                  opt.fallback}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
