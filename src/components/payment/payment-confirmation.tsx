"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CheckCircle2 } from "lucide-react"

import type { BankDetails, CheckoutResult } from "@/lib/payment/types"
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

          {result.gateway === "mobile_money" && (
            <MobileMoneyConfirmation
              instructions={result.mobileMoneyInstructions}
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

function MobileMoneyConfirmation({
  instructions,
  referenceNumber,
  isRTL,
}: {
  instructions?: string
  referenceNumber: string
  isRTL: boolean
}) {
  return (
    <>
      <Separator />
      <div>
        <p className="font-medium">
          {isRTL ? "تعليمات الدفع الإلكتروني" : "Mobile Money Instructions"}
        </p>
        {instructions ? (
          <p className="text-muted-foreground mt-2 text-sm">{instructions}</p>
        ) : (
          <div className="text-muted-foreground mt-2 space-y-1 text-sm">
            <p>
              {isRTL
                ? "1. افتح تطبيق بنكك أو mBOK"
                : "1. Open your Bankak or mBOK app"}
            </p>
            <p>
              {isRTL
                ? `2. أرسل المبلغ مع رقم المرجع: ${referenceNumber}`
                : `2. Send the amount with reference: ${referenceNumber}`}
            </p>
            <p>
              {isRTL
                ? "3. احتفظ بإيصال التحويل"
                : "3. Keep the transfer receipt"}
            </p>
          </div>
        )}
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
