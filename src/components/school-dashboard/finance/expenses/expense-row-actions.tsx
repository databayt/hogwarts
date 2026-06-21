// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface ExpenseRowActionsLabels {
  approve?: string
  reject?: string
  markPaid?: string
  approved?: string
  rejected?: string
  paid?: string
  failed?: string
}

interface ExpenseRowActionsProps {
  expenseId: string
  status: string
  labels?: ExpenseRowActionsLabels
}

/**
 * Status-aware row actions for the expense list. Surfaces the previously
 * UI-orphaned `approveExpense` (PENDING → approve/reject) and `markExpensePaid`
 * (APPROVED → pay, which posts DR expense / CR cash to the ledger). Buttons live
 * outside the row's detail Link so a click does not navigate.
 */
export function ExpenseRowActions({
  expenseId,
  status,
  labels,
}: ExpenseRowActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | "approve" | "reject" | "pay">(null)

  const run = async (kind: "approve" | "reject" | "pay") => {
    try {
      setBusy(kind)
      const actions = await import("./actions")
      let res
      if (kind === "pay") {
        res = await actions.markExpensePaid(expenseId)
      } else {
        const fd = new FormData()
        fd.set("expenseId", expenseId)
        fd.set("status", kind === "approve" ? "APPROVED" : "REJECTED")
        res = await actions.approveExpense(fd)
      }
      if (res?.success) {
        toast.success(
          kind === "pay"
            ? (labels?.paid ?? "Expense marked paid")
            : kind === "approve"
              ? (labels?.approved ?? "Expense approved")
              : (labels?.rejected ?? "Expense rejected")
        )
        router.refresh()
      } else {
        toast.error(
          (res as { error?: string })?.error ??
            labels?.failed ??
            "Action failed"
        )
      }
    } catch {
      toast.error(labels?.failed ?? "Action failed")
    } finally {
      setBusy(null)
    }
  }

  if (status === "PENDING") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          disabled={busy !== null}
          onClick={() => run("approve")}
        >
          {busy === "approve" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {labels?.approve ?? "Approve"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => run("reject")}
        >
          {busy === "reject" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
          {labels?.reject ?? "Reject"}
        </Button>
      </div>
    )
  }

  if (status === "APPROVED") {
    return (
      <Button
        size="sm"
        variant="default"
        disabled={busy !== null}
        onClick={() => run("pay")}
      >
        {busy === "pay" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {labels?.markPaid ?? "Mark paid"}
      </Button>
    )
  }

  return null
}
