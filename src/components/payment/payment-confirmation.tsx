"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CheckCircle2 } from "lucide-react"

import type {
  BankDetails,
  CheckoutResult,
  WalletDetails,
} from "@/lib/payment/types"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface PaymentConfirmationProps {
  result: CheckoutResult
  locale: string
  amount?: number
  currency?: string
}

export function PaymentConfirmation({
  result,
  locale,
  amount,
  currency,
}: PaymentConfirmationProps) {
  const isRTL = locale === "ar"

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold">
          {isRTL ? "تم تسجيل طريقة الدفع" : "Payment Method Recorded"}
        </h2>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {result.referenceNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isRTL ? "رقم المرجع" : "Reference"}
              </span>
              <span className="font-mono font-medium">
                {result.referenceNumber}
              </span>
            </div>
          )}
          {amount != null && currency && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isRTL ? "المبلغ" : "Amount"}
              </span>
              <span className="font-medium">
                {amount} {currency}
              </span>
            </div>
          )}

          {result.gateway === "cash" && (
            <CashConfirmation
              instructions={result.cashInstructions}
              isRTL={isRTL}
            />
          )}

          {result.gateway === "bank_transfer" && result.bankDetails && (
            <BankTransferConfirmation
              bankDetails={result.bankDetails}
              referenceNumber={result.referenceNumber}
              isRTL={isRTL}
            />
          )}

          {result.wallet && (
            <WalletConfirmation
              wallet={result.wallet}
              referenceNumber={result.referenceNumber}
              isRTL={isRTL}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CashConfirmation({
  instructions,
  isRTL,
}: {
  instructions?: string
  isRTL: boolean
}) {
  return (
    <>
      <Separator />
      <div>
        <p className="font-medium">
          {isRTL
            ? "يرجى الدفع في مقر المؤسسة"
            : "Please pay at the institution"}
        </p>
        {instructions && (
          <p className="text-muted-foreground mt-2 text-sm">{instructions}</p>
        )}
        <p className="text-muted-foreground mt-2 text-sm">
          {isRTL
            ? "أحضر رقم المرجع عند الدفع"
            : "Bring the reference number when paying"}
        </p>
      </div>
    </>
  )
}

function BankTransferConfirmation({
  bankDetails,
  referenceNumber,
  isRTL,
}: {
  bankDetails: BankDetails
  referenceNumber: string
  isRTL: boolean
}) {
  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="font-medium">
          {isRTL ? "تفاصيل الحساب البنكي" : "Bank Account Details"}
        </p>
        <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
          <DetailRow
            label={isRTL ? "البنك" : "Bank"}
            value={bankDetails.bankName}
          />
          <DetailRow
            label={isRTL ? "اسم الحساب" : "Account Name"}
            value={bankDetails.accountName}
          />
          <DetailRow
            label={isRTL ? "رقم الحساب" : "Account Number"}
            value={bankDetails.accountNumber}
            mono
          />
          {bankDetails.iban && (
            <DetailRow label="IBAN" value={bankDetails.iban} mono />
          )}
          {bankDetails.swiftCode && (
            <DetailRow label="SWIFT" value={bankDetails.swiftCode} mono />
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {isRTL
            ? `استخدم رقم المرجع "${referenceNumber}" في وصف التحويل`
            : `Use reference "${referenceNumber}" in the transfer description`}
        </p>
      </div>
    </>
  )
}

/**
 * Bankak / Cashi confirmation: shows the school's real wallet account (and QR
 * when configured) rather than the generic "open your app" placeholder the old
 * mobile_money rail rendered — that rail had no source for its instructions, so
 * it always fell through to boilerplate.
 */
function WalletConfirmation({
  wallet,
  referenceNumber,
  isRTL,
}: {
  wallet: WalletDetails
  referenceNumber: string
  isRTL: boolean
}) {
  const isBankak = wallet.provider === "bankak"
  const appName = isBankak
    ? isRTL
      ? "بنكك"
      : "Bankak"
    : isRTL
      ? "ماي كاشي"
      : "MyCashi"

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="font-medium">
          {isRTL ? `التحويل عبر ${appName}` : `Transfer via ${appName}`}
        </p>
        <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
          {wallet.accountName && (
            <DetailRow
              label={isRTL ? "اسم الحساب" : "Account Name"}
              value={wallet.accountName}
            />
          )}
          <DetailRow
            label={
              isBankak
                ? isRTL
                  ? "رقم الحساب"
                  : "Account Number"
                : isRTL
                  ? "رمز التاجر"
                  : "Merchant Code"
            }
            value={wallet.accountNumber}
            mono
          />
        </div>
        {wallet.qrUrl && (
          <div className="flex flex-col items-center gap-2 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={wallet.qrUrl}
              alt={
                isRTL
                  ? `رمز الاستجابة السريعة لـ ${appName}`
                  : `${appName} QR code`
              }
              className="h-40 w-40 rounded-lg border object-contain"
            />
            <p className="text-muted-foreground text-xs">
              {isRTL
                ? `امسح الرمز داخل تطبيق ${appName}`
                : `Scan this in the ${appName} app`}
            </p>
          </div>
        )}
        {wallet.instructions && (
          <p className="text-muted-foreground text-sm">{wallet.instructions}</p>
        )}
        <p className="text-muted-foreground text-sm">
          {isRTL
            ? `استخدم رقم المرجع "${referenceNumber}" في وصف التحويل، ثم أرفق صورة الإيصال لتأكيد الدفع`
            : `Use reference "${referenceNumber}" in the transfer note, then attach the receipt to confirm payment`}
        </p>
      </div>
    </>
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  )
}
