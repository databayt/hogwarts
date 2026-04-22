"use client"

import type { FeePreview } from "@/lib/fee-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface FeePreviewCardDict {
  heading?: string
  academicYear?: string
  totalDue?: string
  installmentsLabel?: string
  dueDateTBD?: string
  installment?: string
  paymentMethodsHeading?: string
  methodStripe?: string
  methodCash?: string
  methodBankTransfer?: string
  bankDetails?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  iban?: string
  swiftCode?: string
  cashInstructions?: string
  noFeesTitle?: string
  noFeesDescription?: string
  subtotal?: string
  netDue?: string
  discountsHeading?: string
  siblingDiscountLabel?: string
  scholarshipDiscountLabel?: string
  overrideLabel?: string
  earlyPaymentDiscountLabel?: string
  scholarshipsHeading?: string
  scholarshipCoveragePercentage?: string
  scholarshipCoverageFixed?: string
  scholarshipCoverageFull?: string
  awardedBadge?: string
  earlyPaymentHint?: string
  earlyPaymentSavings?: string
}

interface FeePreviewCardProps {
  preview: FeePreview
  dictionary?: FeePreviewCardDict
  locale?: string
}

function formatMoney(value: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

function formatDate(iso: string | null, locale: string, fallback: string) {
  if (!iso) return fallback
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return fallback
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function discountLabelKey(
  type: "SIBLING" | "SCHOLARSHIP" | "EARLY_PAYMENT" | "ADMIN_OVERRIDE",
  d: FeePreviewCardDict
): string {
  switch (type) {
    case "SIBLING":
      return d.siblingDiscountLabel || "Sibling discount"
    case "SCHOLARSHIP":
      return d.scholarshipDiscountLabel || "Scholarship"
    case "EARLY_PAYMENT":
      return d.earlyPaymentDiscountLabel || "Early payment"
    case "ADMIN_OVERRIDE":
      return d.overrideLabel || "Adjustment"
  }
}

function scholarshipCoverageText(
  coverageType: "PERCENTAGE" | "FIXED_AMOUNT" | "FULL",
  coverageAmount: number,
  currency: string,
  locale: string,
  d: FeePreviewCardDict
): string {
  switch (coverageType) {
    case "PERCENTAGE":
      return (d.scholarshipCoveragePercentage || "{{value}}% off").replace(
        "{{value}}",
        String(coverageAmount)
      )
    case "FIXED_AMOUNT":
      return (d.scholarshipCoverageFixed || "{{value}} off").replace(
        "{{value}}",
        formatMoney(coverageAmount, currency, locale)
      )
    case "FULL":
      return d.scholarshipCoverageFull || "Full coverage"
  }
}

export function FeePreviewCard({
  preview,
  dictionary: d = {},
  locale = "en",
}: FeePreviewCardProps) {
  if (!preview.matched) {
    return (
      <Alert>
        <AlertDescription>
          <div className="font-medium">
            {d.noFeesTitle || "No fees configured yet"}
          </div>
          <div className="text-muted-foreground mt-1 text-sm">
            {d.noFeesDescription ||
              "The school has not set up fee structures for this grade. You can continue — fees will be communicated separately."}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const methodLabels: Record<"stripe" | "cash" | "bank_transfer", string> = {
    stripe: d.methodStripe || "Card / Online",
    cash: d.methodCash || "Cash",
    bank_transfer: d.methodBankTransfer || "Bank Transfer",
  }

  const enabledMethods = preview.paymentMethods.filter((m) => m.enabled)
  const hasDiscounts = preview.discounts.length > 0
  const netDiffers = preview.netAmount !== preview.subtotal

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">
              {d.heading || "Fee Preview"}
            </CardTitle>
            <Badge variant="secondary">
              {d.academicYear || "Year"}: {preview.academicYear}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(hasDiscounts || netDiffers) && (
            <dl className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <dt className="text-muted-foreground text-sm">
                  {d.subtotal || "Subtotal"}
                </dt>
                <dd className="tabular-nums">
                  {formatMoney(preview.subtotal, preview.currency, locale)}
                </dd>
              </div>
              {preview.discounts.map((discount, i) => (
                <div
                  key={`${discount.type}-${i}`}
                  className="flex items-baseline justify-between"
                >
                  <dt className="text-muted-foreground text-sm">
                    {discountLabelKey(discount.type, d)}
                    {discount.reason && (
                      <span className="ms-1 text-xs">· {discount.reason}</span>
                    )}
                  </dt>
                  <dd className="text-green-600 tabular-nums dark:text-green-500">
                    −{formatMoney(discount.amount, preview.currency, locale)}
                  </dd>
                </div>
              ))}
              <Separator />
              <div className="flex items-baseline justify-between">
                <dt className="font-medium">{d.netDue || "Net Due"}</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {formatMoney(preview.netAmount, preview.currency, locale)}
                </dd>
              </div>
            </dl>
          )}

          {!hasDiscounts && !netDiffers && (
            <div className="flex items-baseline justify-between">
              <div className="text-muted-foreground text-sm">
                {d.totalDue || "Total Due"}
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatMoney(preview.netAmount, preview.currency, locale)}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            {preview.structures.map((s) => (
              <div key={s.id} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium">{s.name}</div>
                  <div className="tabular-nums">
                    {formatMoney(s.totalAmount, preview.currency, locale)}
                  </div>
                </div>
                {s.installments > 1 && (
                  <div className="text-muted-foreground text-xs">
                    {d.installmentsLabel || "Installments"}: {s.installments}
                  </div>
                )}
                {s.schedule.length > 1 && (
                  <div className="bg-muted/40 space-y-1 rounded-md p-2">
                    {s.schedule.map((row) => (
                      <div
                        key={row.sequence}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <div className="text-muted-foreground">
                          {d.installment || "Installment"} {row.sequence} ·{" "}
                          {formatDate(
                            row.dueDate,
                            locale,
                            d.dueDateTBD || "TBD"
                          )}
                        </div>
                        <div className="tabular-nums">
                          {formatMoney(row.amount, preview.currency, locale)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {preview.earlyPaymentHint && (
        <Alert>
          <AlertDescription>
            {(d.earlyPaymentHint || "Pay before {{date}} to save {{savings}}.")
              .replace(
                "{{date}}",
                formatDate(
                  preview.earlyPaymentHint.deadline,
                  locale,
                  d.dueDateTBD || "TBD"
                )
              )
              .replace(
                "{{savings}}",
                formatMoney(
                  preview.earlyPaymentHint.savings,
                  preview.currency,
                  locale
                )
              )}
          </AlertDescription>
        </Alert>
      )}

      {preview.scholarships.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {d.scholarshipsHeading || "Available Scholarships"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {preview.scholarships.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm"
              >
                <div className="space-y-0.5">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {scholarshipCoverageText(
                      s.coverageType,
                      s.coverageAmount,
                      preview.currency,
                      locale,
                      d
                    )}
                  </div>
                </div>
                {s.alreadyAwarded && (
                  <Badge variant="secondary">
                    {d.awardedBadge || "Awarded"}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {enabledMethods.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {d.paymentMethodsHeading || "Accepted Payment Methods"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {enabledMethods.map(({ method }) => (
                <Badge key={method} variant="outline">
                  {methodLabels[method]}
                </Badge>
              ))}
            </div>

            {preview.bankDetails &&
              enabledMethods.some((m) => m.method === "bank_transfer") && (
                <div className="space-y-1 rounded-md border p-3 text-sm">
                  <div className="font-medium">
                    {d.bankDetails || "Bank Transfer Details"}
                  </div>
                  {preview.bankDetails.bankName && (
                    <div>
                      <span className="text-muted-foreground">
                        {d.bankName || "Bank"}:{" "}
                      </span>
                      {preview.bankDetails.bankName}
                    </div>
                  )}
                  {preview.bankDetails.accountName && (
                    <div>
                      <span className="text-muted-foreground">
                        {d.accountName || "Account Name"}:{" "}
                      </span>
                      {preview.bankDetails.accountName}
                    </div>
                  )}
                  {preview.bankDetails.accountNumber && (
                    <div>
                      <span className="text-muted-foreground">
                        {d.accountNumber || "Account Number"}:{" "}
                      </span>
                      {preview.bankDetails.accountNumber}
                    </div>
                  )}
                  {preview.bankDetails.iban && (
                    <div>
                      <span className="text-muted-foreground">
                        {d.iban || "IBAN"}:{" "}
                      </span>
                      {preview.bankDetails.iban}
                    </div>
                  )}
                  {preview.bankDetails.swiftCode && (
                    <div>
                      <span className="text-muted-foreground">
                        {d.swiftCode || "SWIFT"}:{" "}
                      </span>
                      {preview.bankDetails.swiftCode}
                    </div>
                  )}
                </div>
              )}

            {preview.cashPaymentInstructions &&
              enabledMethods.some((m) => m.method === "cash") && (
                <div className="rounded-md border p-3 text-sm">
                  <div className="mb-1 font-medium">
                    {d.cashInstructions || "Cash Payment Instructions"}
                  </div>
                  <div className="text-muted-foreground whitespace-pre-line">
                    {preview.cashPaymentInstructions}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
