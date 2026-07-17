"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { Check, Copy, Loader2, Upload } from "lucide-react"

import { formatCurrency } from "@/lib/i18n-format"
import type { PaymentGateway, WalletDetails } from "@/lib/payment/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"

import { getManualRailDetails, submitManualPaymentProof } from "./actions"

type WalletGateway = Extract<PaymentGateway, "bankak" | "cashi">

export interface ManualRailDictionary {
  title?: string
  step1?: string
  step2?: string
  accountName?: string
  accountNumber?: string
  merchantCode?: string
  reference?: string
  referenceHint?: string
  amount?: string
  scanQr?: string
  copied?: string
  bankReference?: string
  bankReferenceHint?: string
  proof?: string
  proofHint?: string
  submit?: string
  submitting?: string
  submitted?: string
  submittedHint?: string
  uploadFailed?: string
  duplicateReference?: string
  unavailable?: string
  genericError?: string
  close?: string
}

interface Props {
  feeAssignmentId: string
  gateway: WalletGateway
  lang: Locale
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionary?: ManualRailDictionary
}

/**
 * Payer-side dialog for the Sudan wallet rails.
 *
 * Bankak and Cashi have no merchant API, so there is nothing to redirect to:
 * the payer transfers in their own app, then tells us the bank's transaction
 * reference and attaches the receipt. That lands as a PENDING_VERIFICATION
 * Payment for the bursar to clear via the existing "Mark as Cleared" action.
 */
export function ManualPaymentRail({
  feeAssignmentId,
  gateway,
  lang,
  open,
  onOpenChange,
  dictionary: d,
}: Props) {
  const isRTL = lang === "ar"
  const [details, setDetails] = useState<{
    wallet: WalletDetails
    reference: string
    remaining: number
    currency: string
  } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [bankReference, setBankReference] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load the school's account when the dialog opens.
  //
  // Two traps this shape avoids, both of which bit during browser testing:
  //  1. Calling startTransition from the render body throws
  //     "Cannot call startTransition while rendering" and tears the dialog down.
  //  2. Depending on state the effect itself sets (details/loadError/isLoading)
  //     makes React fire THIS run's cleanup the moment the effect flips them —
  //     which sets cancelled=true and silently discards the response that is
  //     already in flight, leaving the spinner up forever. So the deps are only
  //     the inputs that should genuinely retrigger a fetch.
  useEffect(() => {
    if (!open) return

    let cancelled = false
    const unavailable = () =>
      d?.unavailable ??
      (isRTL
        ? "طريقة الدفع هذه غير متاحة حالياً."
        : "This payment method is unavailable right now.")

    setIsLoading(true)
    setLoadError(null)
    getManualRailDetails(feeAssignmentId, gateway)
      .then((result) => {
        if (cancelled) return
        if (result.success && result.data) setDetails(result.data)
        else setLoadError(unavailable())
      })
      .catch(() => {
        if (!cancelled) setLoadError(unavailable())
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    // The dialog can close mid-flight; don't setState on a torn-down tree.
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see note above:
    // details/loadError/isLoading are written here and must not retrigger it.
  }, [open, feeAssignmentId, gateway])

  // Reset when the dialog closes so reopening re-fetches a fresh balance
  // rather than showing a stale amount from the previous visit.
  useEffect(() => {
    if (open) return
    setDetails(null)
    setLoadError(null)
    setBankReference("")
    setFile(null)
    setError(null)
    setDone(false)
  }, [open])

  function copy(value: string, field: string) {
    void navigator.clipboard.writeText(value)
    setCopied(field)
    setTimeout(() => setCopied(null), 1500)
  }

  async function handleSubmit() {
    if (!file || !bankReference.trim() || !details) return
    setError(null)
    setIsUploading(true)

    try {
      // Direct-to-S3 so the receipt bytes never round-trip the server.
      const presign = await fetch("/api/blob/presign-payment-proof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          feeAssignmentId,
        }),
      })
      if (!presign.ok) throw new Error("presign failed")
      const { presignedUrl, finalUrl } = await presign.json()

      const put = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type },
      })
      if (!put.ok) throw new Error("upload failed")

      startTransition(async () => {
        const result = await submitManualPaymentProof({
          feeAssignmentId,
          gateway,
          bankReference: bankReference.trim(),
          proofUrl: finalUrl,
          amount: details.remaining,
        })
        setIsUploading(false)

        if (result.success) {
          setDone(true)
          return
        }
        setError(
          result.error === "PAYMENT_REFERENCE_ALREADY_USED"
            ? (d?.duplicateReference ??
                (isRTL
                  ? "رقم العملية هذا مُستخدم بالفعل. تأكد من الرقم في تطبيق البنك."
                  : "That transaction reference was already submitted. Check the number in your banking app."))
            : (d?.genericError ??
                (isRTL
                  ? "تعذر إرسال الإيصال. حاول مرة أخرى."
                  : "Could not submit the receipt. Please try again."))
        )
      })
    } catch {
      setIsUploading(false)
      setError(
        d?.uploadFailed ??
          (isRTL ? "فشل رفع الإيصال." : "Failed to upload the receipt.")
      )
    }
  }

  const appName =
    gateway === "bankak"
      ? isRTL
        ? "بنكك"
        : "Bankak"
      : isRTL
        ? "ماي كاشي"
        : "MyCashi"

  const busy = isPending || isUploading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {d?.title ??
              (isRTL ? `الدفع عبر ${appName}` : `Pay with ${appName}`)}
          </DialogTitle>
          {!done && details && (
            <DialogDescription>
              {d?.step1 ??
                (isRTL
                  ? `حوّل المبلغ من تطبيق ${appName} إلى الحساب أدناه`
                  : `Transfer from the ${appName} app to the account below`)}
            </DialogDescription>
          )}
        </DialogHeader>

        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {done ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 font-medium">
              <Check className="text-primary size-5" />
              {d?.submitted ??
                (isRTL ? "تم استلام الإيصال" : "Receipt received")}
            </div>
            <p className="text-muted-foreground text-sm">
              {d?.submittedHint ??
                (isRTL
                  ? "سيراجع قسم المالية التحويل ويؤكد الدفع. ستصلك رسالة عند التأكيد."
                  : "The finance office will verify the transfer and confirm your payment. You'll be notified once it's confirmed.")}
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              {d?.close ?? (isRTL ? "إغلاق" : "Close")}
            </Button>
          </div>
        ) : !details ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1 — where to send */}
            <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
              {details.wallet.accountName && (
                <Row
                  label={
                    d?.accountName ?? (isRTL ? "اسم الحساب" : "Account name")
                  }
                  value={details.wallet.accountName}
                />
              )}
              <Row
                label={
                  gateway === "bankak"
                    ? (d?.accountNumber ??
                      (isRTL ? "رقم الحساب" : "Account number"))
                    : (d?.merchantCode ??
                      (isRTL ? "رمز التاجر" : "Merchant code"))
                }
                value={details.wallet.accountNumber}
                mono
                onCopy={() => copy(details.wallet.accountNumber, "account")}
                copied={copied === "account"}
                copiedLabel={d?.copied ?? (isRTL ? "تم النسخ" : "Copied")}
              />
              <Row
                label={d?.amount ?? (isRTL ? "المبلغ" : "Amount")}
                value={formatCurrency(
                  details.remaining,
                  lang,
                  details.currency
                )}
              />
              <Separator />
              <Row
                label={d?.reference ?? (isRTL ? "رقم المرجع" : "Reference")}
                value={details.reference}
                mono
                onCopy={() => copy(details.reference, "reference")}
                copied={copied === "reference"}
                copiedLabel={d?.copied ?? (isRTL ? "تم النسخ" : "Copied")}
              />
              <p className="text-muted-foreground text-xs">
                {d?.referenceHint ??
                  (isRTL
                    ? "اكتب رقم المرجع في ملاحظة التحويل حتى نتمكن من مطابقته."
                    : "Put this reference in the transfer note so we can match it.")}
              </p>
            </div>

            {details.wallet.qrUrl && (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={details.wallet.qrUrl}
                  alt={isRTL ? `رمز ${appName}` : `${appName} QR code`}
                  className="size-40 rounded-lg border object-contain"
                />
                <p className="text-muted-foreground text-xs">
                  {d?.scanQr ??
                    (isRTL
                      ? `أو امسح الرمز داخل تطبيق ${appName}`
                      : `Or scan this in the ${appName} app`)}
                </p>
              </div>
            )}

            {details.wallet.instructions && (
              <p className="text-muted-foreground text-sm">
                {details.wallet.instructions}
              </p>
            )}

            <Separator />

            {/* Step 2 — prove it */}
            <p className="text-sm font-medium">
              {d?.step2 ??
                (isRTL
                  ? "بعد التحويل، أكّد الدفع"
                  : "After transferring, confirm your payment")}
            </p>

            <div className="space-y-2">
              <Label htmlFor="bank-reference">
                {d?.bankReference ??
                  (isRTL ? "رقم العملية من التطبيق" : "Transaction reference")}
              </Label>
              <Input
                id="bank-reference"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                dir="ltr"
                className="font-mono"
                disabled={busy}
              />
              <p className="text-muted-foreground text-xs">
                {d?.bankReferenceHint ??
                  (isRTL
                    ? `انسخ رقم العملية كما يظهر في إيصال ${appName}.`
                    : `Copy the transaction number exactly as it appears on your ${appName} receipt.`)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">
                {d?.proof ?? (isRTL ? "صورة الإيصال" : "Receipt image")}
              </Label>
              <Input
                id="proof"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={busy}
              />
              <p className="text-muted-foreground text-xs">
                {d?.proofHint ??
                  (isRTL
                    ? "أرفق لقطة شاشة لإيصال التحويل."
                    : "Attach a screenshot of the transfer receipt.")}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={busy || !file || bankReference.trim().length < 3}
            >
              {busy ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {d?.submitting ?? (isRTL ? "جارٍ الإرسال…" : "Submitting…")}
                </>
              ) : (
                <>
                  <Upload className="me-2 size-4" />
                  {d?.submit ?? (isRTL ? "تأكيد الدفع" : "Confirm payment")}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  value,
  mono,
  onCopy,
  copied,
  copiedLabel,
}: {
  label: string
  value: string
  mono?: boolean
  onCopy?: () => void
  copied?: boolean
  copiedLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <span
          className={mono ? "font-mono" : "font-medium"}
          dir={mono ? "ltr" : undefined}
        >
          {value}
        </span>
        {onCopy && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onCopy}
            aria-label={copied ? copiedLabel : label}
          >
            {copied ? (
              <Check className="text-primary size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        )}
      </span>
    </div>
  )
}
