// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BanknoteArrowUp,
  CheckCircle2,
  FileText,
  Loader2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type Kind = "generate" | "approve" | "reject" | "disburse"

interface Props {
  runId: string
  /** PayrollStatus of the run. */
  status: string
  /** finance.payrollWorkflow dictionary slice. */
  labels?: Record<string, string>
  /** Whether the caller may run/process payroll (payroll:process). */
  canProcess: boolean
  /** Whether the caller may approve payroll (payroll:approve). */
  canApprove: boolean
}

/**
 * Status-driven payroll workflow bar — the UI that makes the disbursement path
 * (and thus postSalaryPayment → the ledger) reachable. Each button calls its
 * already-gated server action and refreshes.
 *
 *   DRAFT / PROCESSING  → Generate Slips     (→ PENDING_APPROVAL)
 *   PENDING_APPROVAL    → Approve / Reject   (→ APPROVED / DRAFT)
 *   APPROVED            → Disburse Salaries  (→ PAID, posts to ledger)
 *   PAID                → (no actions)
 */
export function PayrollRunActions({
  runId,
  status,
  labels,
  canProcess,
  canApprove,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<Kind | null>(null)

  const interp = (t: string | undefined, p: Record<string, string | number>) =>
    Object.entries(p).reduce(
      (out, [k, v]) => out.replaceAll(`{${k}}`, String(v)),
      t ?? ""
    )

  const run = async (kind: Kind) => {
    if (kind === "disburse" && !confirm(labels?.confirmDisburse)) return
    let reason = ""
    if (kind === "reject") {
      reason = (prompt(labels?.confirmReject) ?? "").trim()
      if (!reason) return
    }
    setBusy(kind)
    try {
      const actions = await import("./actions")
      let res: { success: boolean; error?: string; data?: unknown }
      if (kind === "generate") {
        // undefined teacherIds = generate for all active staff in the run.
        res = await actions.generateSalarySlips(runId, undefined)
      } else if (kind === "approve") {
        res = await actions.approvePayroll(runId, undefined)
      } else if (kind === "reject") {
        res = await actions.rejectPayroll(runId, reason)
      } else {
        res = await actions.processPayments(runId)
      }

      if (res.success) {
        const msg =
          kind === "generate"
            ? interp(labels?.slipsGenerated, {
                count: typeof res.data === "number" ? res.data : "",
              })
            : kind === "approve"
              ? labels?.runApproved
              : kind === "reject"
                ? labels?.runRejected
                : labels?.runDisbursed
        toast.success(msg || "")
        router.refresh()
      } else {
        toast.error(labels?.actionFailed || res.error || "")
      }
    } catch {
      toast.error(labels?.actionFailed || "")
    } finally {
      setBusy(null)
    }
  }

  const spin = (k: Kind) =>
    busy === k ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null

  if (status === "PAID" || status === "CANCELLED") return null

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "DRAFT" || status === "PROCESSING") && canProcess && (
        <Button onClick={() => run("generate")} disabled={busy !== null}>
          {spin("generate") ?? <FileText className="me-2 h-4 w-4" />}
          {labels?.generateSlips || "Generate Slips"}
        </Button>
      )}

      {status === "PENDING_APPROVAL" && canApprove && (
        <>
          <Button onClick={() => run("approve")} disabled={busy !== null}>
            {spin("approve") ?? <CheckCircle2 className="me-2 h-4 w-4" />}
            {labels?.approve || "Approve"}
          </Button>
          <Button
            variant="outline"
            onClick={() => run("reject")}
            disabled={busy !== null}
          >
            {spin("reject") ?? <X className="me-2 h-4 w-4" />}
            {labels?.reject || "Reject"}
          </Button>
        </>
      )}

      {status === "APPROVED" && canProcess && (
        <Button onClick={() => run("disburse")} disabled={busy !== null}>
          {spin("disburse") ?? <BanknoteArrowUp className="me-2 h-4 w-4" />}
          {labels?.disburse || "Disburse Salaries"}
        </Button>
      )}
    </div>
  )
}
