"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Loader2,
  XCircle,
} from "lucide-react"

import type { BankDetails } from "@/lib/payment/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { OfferDetails } from "./actions"
import {
  acceptOffer,
  createRegistrationFeeCheckout,
  declineOffer,
  recordRegistrationBankTransferIntent,
  recordRegistrationCashIntent,
} from "./actions"

interface OfferContentProps {
  offer: OfferDetails
  locale: string
  dictionary: Dictionary
  cancelled?: boolean
}

export default function OfferContent({
  offer,
  locale,
  dictionary,
  cancelled,
}: OfferContentProps) {
  const router = useRouter()
  const t = (dictionary as any)?.school?.admission?.offer as
    | Record<string, string>
    | undefined
  const {
    application,
    school,
    campaign,
    feeSchedulePreview,
    registrationFeeTotal,
  } = offer

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(application.offerAccepted)
  const [declined, setDeclined] = useState(false)
  const [regPaid, setRegPaid] = useState(application.registrationFeePaid)
  const [paymentResult, setPaymentResult] = useState<{
    method: string
    referenceNumber?: string
    cashInstructions?: string
    bankDetails?: BankDetails
  } | null>(null)

  // Calculate time remaining
  const expiryDate = application.offerExpiryDate
    ? new Date(application.offerExpiryDate)
    : null
  const now = new Date()
  const isExpired = expiryDate ? expiryDate < now : false
  const daysRemaining = expiryDate
    ? Math.max(
        0,
        Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : null

  const totalAnnualFees = feeSchedulePreview.reduce(
    (sum, fs) => sum + fs.totalAmount,
    0
  )

  const handleAccept = async () => {
    setLoading("accept")
    setError(null)
    const result = await acceptOffer(application.id, "")
    setLoading(null)
    if (result.success) {
      setAccepted(true)
    } else {
      setError(result.error || t?.failedToAccept || "Failed to accept offer")
    }
  }

  const handleDecline = async () => {
    setLoading("decline")
    setError(null)
    const result = await declineOffer(application.id, "")
    setLoading(null)
    if (result.success) {
      setDeclined(true)
    } else {
      setError(result.error || t?.failedToDecline || "Failed to decline offer")
    }
  }

  const handlePayment = async (method: string) => {
    setLoading(method)
    setError(null)

    try {
      if (method === "stripe") {
        const result = await createRegistrationFeeCheckout(
          application.id,
          "",
          locale
        )
        if (result.success && result.data?.checkoutUrl) {
          window.location.href = result.data.checkoutUrl
          return
        }
        setError(
          result.error || t?.failedCheckout || "Failed to create checkout"
        )
      } else if (method === "cash") {
        const result = await recordRegistrationCashIntent(application.id, "")
        if (result.success && result.data) {
          setPaymentResult({
            method: "cash",
            referenceNumber: result.data.referenceNumber,
            cashInstructions: result.data.cashInstructions,
          })
          setRegPaid(true)
        } else {
          setError(
            result.error || t?.failedPayment || "Failed to record payment"
          )
        }
      } else if (method === "bank_transfer") {
        const result = await recordRegistrationBankTransferIntent(
          application.id,
          ""
        )
        if (result.success && result.data) {
          setPaymentResult({
            method: "bank_transfer",
            referenceNumber: result.data.referenceNumber,
            bankDetails: result.data.bankDetails,
          })
          setRegPaid(true)
        } else {
          setError(
            result.error || t?.failedPayment || "Failed to record payment"
          )
        }
      }
    } catch {
      setError(t?.unexpectedError || "An unexpected error occurred")
    } finally {
      setLoading(null)
    }
  }

  // Declined state
  if (declined) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <XCircle className="text-muted-foreground h-16 w-16" />
        <h2 className="text-xl font-semibold">
          {t?.declined || "Offer Declined"}
        </h2>
        <p className="text-muted-foreground text-center">
          {t?.declinedMessage ||
            "The admission offer has been declined. Contact the school for more information."}
        </p>
      </div>
    )
  }

  // Expired state
  if (isExpired && !accepted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <CalendarClock className="text-destructive h-16 w-16" />
        <h2 className="text-xl font-semibold">
          {t?.expired || "Offer Expired"}
        </h2>
        <p className="text-muted-foreground text-center">
          {t?.expiredMessage ||
            "This admission offer has expired. Please contact the school."}
        </p>
      </div>
    )
  }

  // Payment confirmation state
  if (paymentResult) {
    return (
      <div className="min-h-screen py-6 sm:py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">
              {t?.paymentMethodRecorded || "Payment Method Recorded"}
            </h1>
          </div>

          <Card className="mb-6">
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t?.application || "Application"}
                </span>
                <span className="font-mono font-medium">
                  {application.applicationNumber}
                </span>
              </div>
              {paymentResult.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t?.reference || "Reference"}
                  </span>
                  <span className="font-mono font-medium">
                    {paymentResult.referenceNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t?.amount || "Amount"}
                </span>
                <span className="font-medium">
                  {registrationFeeTotal} {school.currency}
                </span>
              </div>

              {paymentResult.method === "cash" && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium">
                      {t?.payAtSchool || "Please pay at the school office"}
                    </p>
                    {paymentResult.cashInstructions && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        {paymentResult.cashInstructions}
                      </p>
                    )}
                  </div>
                </>
              )}

              {paymentResult.method === "bank_transfer" &&
                paymentResult.bankDetails && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="font-medium">
                        {t?.bankAccountDetails || "Bank Account Details"}
                      </p>
                      <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
                        {paymentResult.bankDetails.bankName && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">
                              {t?.bank || "Bank"}
                            </span>
                            <span>{paymentResult.bankDetails.bankName}</span>
                          </div>
                        )}
                        {paymentResult.bankDetails.accountName && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">
                              {t?.accountName || "Account Name"}
                            </span>
                            <span>{paymentResult.bankDetails.accountName}</span>
                          </div>
                        )}
                        {paymentResult.bankDetails.accountNumber && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">
                              {t?.accountNumber || "Account Number"}
                            </span>
                            <span className="font-mono">
                              {paymentResult.bankDetails.accountNumber}
                            </span>
                          </div>
                        )}
                        {paymentResult.bankDetails.iban && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">IBAN</span>
                            <span className="font-mono">
                              {paymentResult.bankDetails.iban}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-center text-sm">
            {t?.notificationMessage ||
              "You will be notified once payment is confirmed and enrollment is finalized."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 sm:py-12">
      <div className="container mx-auto max-w-3xl space-y-6 px-4">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <GraduationCap className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t?.congratulations || "Congratulations! You've Been Accepted"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {application.firstName} {application.lastName} — {school.name}
          </p>
        </div>

        {cancelled && (
          <Alert variant="destructive">
            <AlertTitle>
              {t?.paymentCancelled || "Payment Cancelled"}
            </AlertTitle>
            <AlertDescription>
              {t?.paymentCancelledMessage ||
                "Payment was cancelled. You can try again."}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Offer Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.offerDetails || "Offer Details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t?.applicationNumber || "Application #"}
              </span>
              <span className="font-mono font-medium">
                {application.applicationNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t?.class || "Class"}
              </span>
              <span className="font-medium">
                {application.applyingForClass}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t?.academicYear || "Academic Year"}
              </span>
              <span className="font-medium">{campaign.academicYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t?.status || "Status"}
              </span>
              <Badge variant={accepted ? "default" : "secondary"}>
                {accepted
                  ? t?.accepted || "Accepted"
                  : t?.awaitingAcceptance || "Awaiting Acceptance"}
              </Badge>
            </div>
            {daysRemaining !== null && !accepted && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t?.expiresIn || "Expires in"}
                </span>
                <Badge variant={daysRemaining <= 3 ? "destructive" : "outline"}>
                  {daysRemaining === 0
                    ? t?.today || "Today"
                    : `${daysRemaining} ${daysRemaining !== 1 ? t?.days || "days" : t?.day || "day"}`}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Schedule Preview */}
        {feeSchedulePreview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t?.feeSchedule || "Fee Schedule"}</CardTitle>
              <CardDescription>
                {(t?.feesForYear || "Fees for academic year {year}").replace(
                  "{year}",
                  campaign.academicYear
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t?.item || "Item"}</TableHead>
                    <TableHead className="text-end">
                      {t?.amount || "Amount"}
                    </TableHead>
                    <TableHead className="text-end">
                      {t?.installments || "Installments"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeSchedulePreview.map((fs) => (
                    <TableRow key={fs.id}>
                      <TableCell className="font-medium">{fs.name}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        {fs.totalAmount} {school.currency}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {fs.installments}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell>{t?.annualTotal || "Annual Total"}</TableCell>
                    <TableCell className="text-end tabular-nums">
                      {totalAnnualFees} {school.currency}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Accept/Decline (if not yet accepted) */}
        {!accepted && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t?.step1Title || "Step 1: Accept the Offer"}
              </CardTitle>
              <CardDescription>
                {t?.step1Description ||
                  "Please accept or decline the admission offer"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button
                onClick={handleAccept}
                disabled={loading !== null}
                className="flex-1"
              >
                {loading === "accept" && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {t?.acceptOffer || "Accept Offer"}
              </Button>
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={loading !== null}
              >
                {loading === "decline" && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {t?.decline || "Decline"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Registration Fee Payment (after acceptance) */}
        {accepted && !regPaid && registrationFeeTotal > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t?.step2Title || "Step 2: Pay Registration Fee"}
              </CardTitle>
              <CardDescription>
                {t?.step2Description ||
                  "Pay the registration fee to secure your seat"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted mb-4 rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-sm">
                  {t?.amountDue || "Amount Due"}
                </p>
                <p className="text-2xl font-bold">
                  {registrationFeeTotal} {school.currency}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    method: "stripe",
                    icon: CreditCard,
                    label: t?.payWithCard || "Pay with Card",
                    desc: t?.payWithCardDesc || "Pay with credit or debit card",
                  },
                  {
                    method: "cash",
                    icon: Banknote,
                    label: t?.payAtSchoolLabel || "Pay at School",
                    desc:
                      t?.payAtSchoolDesc || "Pay in cash at the school office",
                  },
                  {
                    method: "bank_transfer",
                    icon: Building2,
                    label: t?.bankTransfer || "Bank Transfer",
                    desc:
                      t?.bankTransferDesc ||
                      "Transfer to the school bank account",
                  },
                ].map(({ method, icon: Icon, label, desc }) => (
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
                        <h3 className="font-medium">{label}</h3>
                        <p className="text-muted-foreground text-sm">{desc}</p>
                      </div>
                      {loading === method && (
                        <Loader2 className="text-primary h-5 w-5 animate-spin" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed state */}
        {accepted && (regPaid || registrationFeeTotal === 0) && (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="flex items-center gap-4 pt-6">
              <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-green-600" />
              <div>
                <h3 className="font-semibold">
                  {t?.acceptedSuccessfully || "Offer Accepted Successfully"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t?.enrollmentNotification ||
                    "You will be notified once the school confirms your enrollment."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
