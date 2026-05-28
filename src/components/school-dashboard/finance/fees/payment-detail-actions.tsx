// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { markPaymentCleared } from "./actions"
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
   * Payment ID, used by the Mark-as-Cleared action (P2.1). When omitted
   * the clear button is hidden — preserves the legacy callers that only
   * want the receipt download.
   */
  paymentId?: string
  /**
   * Optional dictionary so the labels stay translatable. Falls back to
   * English/Arabic in-component if the dict key is missing.
   */
  dictionary?: {
    markAsCleared?: string
    clearing?: string
    cleared?: string
    clearFailed?: string
  }
}

export function PaymentDetailActions({
  receiptData,
  paymentId,
  dictionary,
}: PaymentDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const showClearButton =
    paymentId && receiptData.status === "PENDING_VERIFICATION"

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

  return (
    <div className="flex gap-2">
      {showClearButton && (
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
      )}
      <DownloadReceipt data={receiptData} />
    </div>
  )
}
