// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { markPaymentCleared, rejectPaymentProof } from "./actions"
import { DownloadReceipt } from "./receipt-pdf"

interface PaymentDetailActionsProps {
  receiptData: {
    paymentNumber: string
    receiptNumber: string
    amount: string
    paymentDate: string
    paymentMethod: string
    status: string
    transactionId?: string
    studentName: string
    feeStructureName: string
    academicYear: string
    schoolName?: string
  }
  /**
   * Payment ID, used by the Mark-as-Cleared / Reject actions (P2.1). When
   * omitted both buttons are hidden — preserves the legacy callers that only
   * want the receipt download.
   */
  paymentId?: string
  /**
   * Optional dictionary so the labels stay translatable. Falls back to
   * English in-component if the dict key is missing.
   */
  dictionary?: {
    markAsCleared?: string
    clearing?: string
    cleared?: string
    clearFailed?: string
    reject?: string
    rejecting?: string
    rejected?: string
    rejectFailed?: string
    rejectTitle?: string
    rejectDescription?: string
    rejectReason?: string
    rejectReasonPlaceholder?: string
    cancel?: string
    confirmReject?: string
  }
}

export function PaymentDetailActions({
  receiptData,
  paymentId,
  dictionary,
}: PaymentDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")

  const isPendingVerification =
    Boolean(paymentId) && receiptData.status === "PENDING_VERIFICATION"

  function handleClear() {
    if (!paymentId) return
    startTransition(async () => {
      const result = await markPaymentCleared(paymentId)
      if (result.success) {
        toast.success(dictionary?.cleared || "Payment cleared")
        router.refresh()
      } else {
        toast.error(dictionary?.clearFailed || "Failed to clear payment")
      }
    })
  }

  function handleReject() {
    if (!paymentId) return
    startTransition(async () => {
      const result = await rejectPaymentProof({
        paymentId,
        reason: reason.trim() || undefined,
      })
      if (result.success) {
        toast.success(dictionary?.rejected || "Payment proof rejected")
        setRejectOpen(false)
        setReason("")
        router.refresh()
      } else {
        toast.error(dictionary?.rejectFailed || "Failed to reject payment")
      }
    })
  }

  return (
    <div className="flex gap-2">
      {isPendingVerification && (
        <>
          <Button onClick={handleClear} disabled={isPending}>
            {isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="me-2 h-4 w-4" />
            )}
            {isPending
              ? dictionary?.clearing || "Clearing..."
              : dictionary?.markAsCleared || "Mark as Cleared"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            <X className="me-2 h-4 w-4" />
            {dictionary?.reject || "Reject"}
          </Button>
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {dictionary?.rejectTitle || "Reject payment proof"}
                </DialogTitle>
                <DialogDescription>
                  {dictionary?.rejectDescription ||
                    "The payment stays on record as failed and the family is asked to submit the correct transfer again."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="reject-reason">
                  {dictionary?.rejectReason || "Reason (optional)"}
                </Label>
                <Textarea
                  id="reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  placeholder={
                    dictionary?.rejectReasonPlaceholder ||
                    "e.g. amount does not match, reference not found"
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setRejectOpen(false)}
                  disabled={isPending}
                >
                  {dictionary?.cancel || "Cancel"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isPending
                    ? dictionary?.rejecting || "Rejecting..."
                    : dictionary?.confirmReject || "Reject proof"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
      {/* A receipt is only meaningful for money that actually settled —
          same rule as the server PDF route (SUCCESS / REFUNDED). */}
      {(receiptData.status === "SUCCESS" ||
        receiptData.status === "REFUNDED") && (
        <DownloadReceipt data={receiptData} />
      )}
    </div>
  )
}
