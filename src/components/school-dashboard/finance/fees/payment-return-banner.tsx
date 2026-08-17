"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CircleCheck, CircleX, Loader2, TriangleAlert } from "lucide-react"

import { formatCurrency } from "@/lib/i18n-format"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"

import { verifyReturnedFeePayment, type ReturnedPaymentState } from "./actions"

export interface PaymentReturnDictionary {
  verifying?: string
  recordedTitle?: string
  recordedBody?: string
  alreadyRecordedBody?: string
  pendingTitle?: string
  pendingBody?: string
  failedTitle?: string
  failedBody?: string
  cancelledTitle?: string
  cancelledBody?: string
  unknownBody?: string
  downloadReceipt?: string
  dismiss?: string
}

interface Props {
  /** `success` | `cancelled` — the `?payment=` the gateway sent us back with. */
  outcome: "success" | "cancelled"
  feeAssignmentId: string
  gateway?: "stripe" | "tap"
  /** Stripe `{CHECKOUT_SESSION_ID}` substitution. */
  sessionId?: string
  /** Tap appends `tap_id=chg_…` to the redirect URL. */
  tapId?: string
  lang: Locale
  currency: string
  dictionary?: PaymentReturnDictionary
}

const FALLBACK: Record<Locale, Required<PaymentReturnDictionary>> = {
  en: {
    verifying: "Confirming your payment with the gateway…",
    recordedTitle: "Payment received",
    recordedBody: "{amount} has been recorded. Remaining balance: {remaining}.",
    alreadyRecordedBody:
      "This payment was already recorded. Remaining balance: {remaining}.",
    pendingTitle: "Payment is being processed",
    pendingBody:
      "The gateway has not confirmed the charge yet. This page will update automatically — please do not pay again.",
    failedTitle: "Payment did not go through",
    failedBody:
      "The charge was not completed. You can try again or choose another method.",
    cancelledTitle: "Payment cancelled",
    cancelledBody: "No charge was made. You can pay whenever you are ready.",
    unknownBody:
      "We could not confirm the payment automatically. If you were charged, it will appear here shortly.",
    downloadReceipt: "Download receipt",
    dismiss: "Dismiss",
  },
  ar: {
    verifying: "جارٍ تأكيد الدفع مع بوابة الدفع…",
    recordedTitle: "تم استلام الدفع",
    recordedBody: "تم تسجيل {amount}. المتبقي: {remaining}.",
    alreadyRecordedBody: "تم تسجيل هذه الدفعة مسبقاً. المتبقي: {remaining}.",
    pendingTitle: "الدفع قيد المعالجة",
    pendingBody:
      "لم تؤكد بوابة الدفع العملية بعد. ستُحدَّث هذه الصفحة تلقائياً — يرجى عدم الدفع مرة أخرى.",
    failedTitle: "لم تكتمل عملية الدفع",
    failedBody: "لم يتم الخصم. يمكنك المحاولة مرة أخرى أو اختيار طريقة أخرى.",
    cancelledTitle: "تم إلغاء الدفع",
    cancelledBody: "لم يتم خصم أي مبلغ. يمكنك الدفع متى شئت.",
    unknownBody: "تعذر تأكيد الدفع تلقائياً. إذا تم الخصم فسيظهر هنا قريباً.",
    downloadReceipt: "تنزيل الإيصال",
    dismiss: "إغلاق",
  },
}

function fill(template: string, params: Record<string, string>) {
  return Object.entries(params).reduce(
    (out, [k, v]) => out.replaceAll(`{${k}}`, v),
    template
  )
}

/** How many times to re-ask while the gateway still says "pending". */
const MAX_POLLS = 6
const POLL_MS = 3000

/**
 * Lands the payer back from a hosted checkout with a truthful state.
 *
 * Both gateways redirect before their webhook fires, so the page underneath
 * may still show the old balance. On `success` this asks the server to read
 * the charge back from the gateway (and record it if the webhook has not),
 * then refreshes the route so totals and the pay button reflect reality. It
 * polls a few times while the gateway reports "processing" and never shows
 * "paid" on the strength of the URL alone — Tap uses the SAME redirect URL
 * for failed charges.
 */
export function PaymentReturnBanner({
  outcome,
  feeAssignmentId,
  gateway,
  sessionId,
  tapId,
  lang,
  currency,
  dictionary,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const d = { ...FALLBACK[lang === "ar" ? "ar" : "en"], ...dictionary }

  const [state, setState] = useState<ReturnedPaymentState | "verifying">(
    outcome === "success" ? "verifying" : "unknown"
  )
  const [amount, setAmount] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const polls = useRef(0)
  const refreshed = useRef(false)

  useEffect(() => {
    if (outcome !== "success") return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const run = async () => {
      const result = await verifyReturnedFeePayment({
        feeAssignmentId,
        gateway,
        sessionId,
        tapId,
      })
      if (cancelled) return
      if (!result.success || !result.data) {
        setState("unknown")
        return
      }
      const data = result.data
      setRemaining(data.remaining)
      if (data.amount != null) setAmount(data.amount)
      if (data.paymentId) setPaymentId(data.paymentId)
      setState(data.state)

      if (
        (data.state === "recorded" || data.state === "already_recorded") &&
        !refreshed.current
      ) {
        // Totals + pay button live in server components — re-render them.
        refreshed.current = true
        router.refresh()
      } else if (data.state === "pending" && polls.current < MAX_POLLS) {
        polls.current += 1
        timer = setTimeout(run, POLL_MS)
      }
    }
    void run()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [outcome, feeAssignmentId, gateway, sessionId, tapId, router])

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    // Drop the gateway params so a reload does not replay the banner.
    router.replace(pathname)
  }

  const money = (v: number) => formatCurrency(v, lang, currency)

  if (outcome === "cancelled") {
    return (
      <Alert>
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>{d.cancelledTitle}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>{d.cancelledBody}</span>
          <Button variant="ghost" size="sm" onClick={dismiss}>
            {d.dismiss}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (state === "verifying") {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>{d.verifying}</AlertDescription>
      </Alert>
    )
  }

  if (state === "recorded" || state === "already_recorded") {
    const body =
      state === "recorded" && amount != null
        ? fill(d.recordedBody, {
            amount: money(amount),
            remaining: money(remaining ?? 0),
          })
        : fill(d.alreadyRecordedBody, { remaining: money(remaining ?? 0) })
    return (
      <Alert className="border-green-500/40">
        <CircleCheck className="h-4 w-4 text-green-600" />
        <AlertTitle>{d.recordedTitle}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>{body}</span>
          {paymentId && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/api/payment/${paymentId}/receipt`}
                target="_blank"
                rel="noreferrer"
              >
                {d.downloadReceipt}
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={dismiss}>
            {d.dismiss}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (state === "pending") {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>{d.pendingTitle}</AlertTitle>
        <AlertDescription>{d.pendingBody}</AlertDescription>
      </Alert>
    )
  }

  if (state === "failed") {
    return (
      <Alert variant="destructive">
        <CircleX className="h-4 w-4" />
        <AlertTitle>{d.failedTitle}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>{d.failedBody}</span>
          <Button variant="ghost" size="sm" onClick={dismiss}>
            {d.dismiss}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <TriangleAlert className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>{d.unknownBody}</span>
        <Button variant="ghost" size="sm" onClick={dismiss}>
          {d.dismiss}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
