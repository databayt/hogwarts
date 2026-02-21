"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useLocale } from "@/components/internationalization/use-locale"

import {
  createStripeCheckout,
  recordBankTransferIntent,
  recordCashPaymentIntent,
} from "./actions"

interface PaymentContentProps {
  applicationNumber: string
  applicationId: string
  fee: number
  currency: string
  methods: string[]
}

const GATEWAY_CONFIG: Record<
  string,
  {
    icon: React.ElementType
    label: { ar: string; en: string }
    description: { ar: string; en: string }
  }
> = {
  stripe: {
    icon: CreditCard,
    label: { ar: "الدفع بالبطاقة", en: "Pay with Card" },
    description: {
      ar: "ادفع بأمان ببطاقة الائتمان أو الخصم",
      en: "Pay securely with credit or debit card",
    },
  },
  cash: {
    icon: Banknote,
    label: { ar: "الدفع في المدرسة", en: "Pay at School" },
    description: {
      ar: "ادفع نقداً في مقر المدرسة",
      en: "Pay in cash at the school office",
    },
  },
  bank_transfer: {
    icon: Building2,
    label: { ar: "تحويل بنكي", en: "Bank Transfer" },
    description: {
      ar: "حوّل المبلغ إلى حساب المدرسة البنكي",
      en: "Transfer to the school bank account",
    },
  },
}

export default function PaymentContent({
  applicationNumber,
  applicationId,
  fee,
  currency,
  methods,
}: PaymentContentProps) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const subdomain = params.subdomain as string
  const id = params.id as string

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completedMethod, setCompletedMethod] = useState<string | null>(null)
  const [resultData, setResultData] = useState<{
    referenceNumber?: string
    cashInstructions?: string
    bankDetails?: {
      bankName: string
      accountName: string
      accountNumber: string
      iban?: string
      swiftCode?: string
      reference: string
    }
  } | null>(null)

  const handlePayment = async (method: string) => {
    setLoading(method)
    setError(null)

    try {
      if (method === "stripe") {
        const result = await createStripeCheckout(
          subdomain,
          applicationId,
          fee,
          currency
        )
        if (!result.success) {
          setError(result.error ?? "Payment failed")
          setLoading(null)
          return
        }
        if (result.data?.checkoutUrl) {
          window.location.href = result.data.checkoutUrl
          return
        }
      } else if (method === "cash") {
        const result = await recordCashPaymentIntent(subdomain, applicationId)
        if (!result.success) {
          setError(result.error ?? "Failed to record payment")
          setLoading(null)
          return
        }
        setCompletedMethod("cash")
        setResultData({
          referenceNumber: result.data?.referenceNumber,
          cashInstructions: result.data?.cashInstructions,
        })
      } else if (method === "bank_transfer") {
        const result = await recordBankTransferIntent(subdomain, applicationId)
        if (!result.success) {
          setError(result.error ?? "Failed to record payment")
          setLoading(null)
          return
        }
        setCompletedMethod("bank_transfer")
        setResultData({
          referenceNumber: result.data?.referenceNumber,
          bankDetails: result.data?.bankDetails,
        })
      }
    } catch {
      setError(
        isRTL ? "حدث خطأ أثناء معالجة الدفع" : "Error processing payment"
      )
    } finally {
      setLoading(null)
    }
  }

  // Show confirmation after cash or bank transfer selection
  if (completedMethod && resultData) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">
              {isRTL ? "تم تسجيل طريقة الدفع" : "Payment Method Recorded"}
            </h1>
          </div>

          <Card className="mb-6">
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isRTL ? "رقم الطلب" : "Application"}
                </span>
                <span className="font-mono font-medium">
                  {applicationNumber}
                </span>
              </div>
              {resultData.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isRTL ? "رقم المرجع" : "Reference"}
                  </span>
                  <span className="font-mono font-medium">
                    {resultData.referenceNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isRTL ? "المبلغ" : "Amount"}
                </span>
                <span className="font-medium">
                  {fee} {currency}
                </span>
              </div>

              {completedMethod === "cash" && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium">
                      {isRTL
                        ? "يرجى الدفع في مقر المدرسة"
                        : "Please pay at the school office"}
                    </p>
                    {resultData.cashInstructions && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        {resultData.cashInstructions}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-2 text-sm">
                      {isRTL
                        ? "أحضر رقم المرجع عند الدفع"
                        : "Bring the reference number when paying"}
                    </p>
                  </div>
                </>
              )}

              {completedMethod === "bank_transfer" &&
                resultData.bankDetails && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="font-medium">
                        {isRTL
                          ? "تفاصيل الحساب البنكي"
                          : "Bank Account Details"}
                      </p>
                      <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {isRTL ? "البنك" : "Bank"}
                          </span>
                          <span>{resultData.bankDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {isRTL ? "اسم الحساب" : "Account Name"}
                          </span>
                          <span>{resultData.bankDetails.accountName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {isRTL ? "رقم الحساب" : "Account Number"}
                          </span>
                          <span className="font-mono">
                            {resultData.bankDetails.accountNumber}
                          </span>
                        </div>
                        {resultData.bankDetails.iban && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">IBAN</span>
                            <span className="font-mono">
                              {resultData.bankDetails.iban}
                            </span>
                          </div>
                        )}
                        {resultData.bankDetails.swiftCode && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SWIFT</span>
                            <span className="font-mono">
                              {resultData.bankDetails.swiftCode}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {isRTL
                          ? `استخدم رقم المرجع "${resultData.referenceNumber}" في وصف التحويل`
                          : `Use reference "${resultData.referenceNumber}" in the transfer description`}
                      </p>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={() =>
                router.push(
                  `/${locale}/apply/${id}/success?number=${applicationNumber}`
                )
              }
            >
              {isRTL ? "متابعة" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">
            {isRTL ? "دفع رسوم التقديم" : "Application Fee Payment"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRTL ? "رقم الطلب: " : "Application: "}
            <span className="font-mono font-medium">{applicationNumber}</span>
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardDescription>
              {isRTL ? "المبلغ المطلوب" : "Amount Due"}
            </CardDescription>
            <CardTitle className="text-3xl">
              {fee} {currency}
            </CardTitle>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {isRTL ? "اختر طريقة الدفع:" : "Choose a payment method:"}
          </p>

          {methods.map((method) => {
            const config = GATEWAY_CONFIG[method]
            if (!config) return null
            const Icon = config.icon
            const isLoading = loading === method

            return (
              <Card
                key={method}
                className="hover:border-primary cursor-pointer transition-colors"
                onClick={() => !loading && handlePayment(method)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
                    <Icon className="text-primary h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {isRTL ? config.label.ar : config.label.en}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {isRTL ? config.description.ar : config.description.en}
                    </p>
                  </div>
                  {isLoading && (
                    <Loader2 className="text-primary h-5 w-5 animate-spin" />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
