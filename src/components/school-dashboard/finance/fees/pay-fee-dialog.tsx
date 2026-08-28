"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { CreditCard } from "lucide-react"

import type { PaymentGateway } from "@/lib/payment/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Locale } from "@/components/internationalization/config"

import {
  GatewayPicker,
  payableGateways,
  type GatewayPickerDictionary,
} from "./fee-payment-methods"
import type { ManualRailDictionary } from "./manual-payment-rail"

interface Props {
  feeAssignmentId: string
  lang: Locale
  remaining: number
  methods: PaymentGateway[]
  /** Fee name shown in the dialog header, e.g. "Tuition 2026 — Ahmed". */
  label?: string
  dictionary?: GatewayPickerDictionary
  manualRailDictionary?: ManualRailDictionary
}

/**
 * Per-row "Pay" for the family portal (`/finance/fees/my`).
 *
 * Replaces the old single `PayOnlineButton`, which called the checkout action
 * with NO gateway — the server then took the school's first non-manual rail,
 * so on a Sudan school (Bankak/Cashi only) it silently did nothing, and on a
 * multi-rail school it never let the parent choose. This opens the same
 * picker the admin assignment page uses, so a parent sees exactly the rails
 * their school configured — including the wallet rails with their transfer
 * + proof dialog.
 */
export function PayFeeDialog({
  feeAssignmentId,
  lang,
  remaining,
  methods,
  label,
  dictionary,
  manualRailDictionary,
}: Props) {
  const isRTL = lang === "ar"
  const [open, setOpen] = useState(false)

  if (remaining <= 0 || payableGateways(methods).length === 0) return null

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CreditCard className="me-2 h-4 w-4" />
        {dictionary?.pay ?? (isRTL ? "ادفع" : "Pay")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {dictionary?.title ?? (isRTL ? "ادفع الرسوم" : "Pay Fees")}
            </DialogTitle>
            {label && <DialogDescription>{label}</DialogDescription>}
          </DialogHeader>
          <GatewayPicker
            feeAssignmentId={feeAssignmentId}
            lang={lang}
            methods={methods}
            dictionary={dictionary}
            manualRailDictionary={manualRailDictionary}
            onWalletSubmitted={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
