"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

interface SuccessContentProps {
  dictionary: Dictionary
  applicationNumber?: string
  schoolName?: string
  paymentMethod?: string | null
  paymentReference?: string | null
  applicationFeePaid?: boolean
}

export default function SuccessContent({
  dictionary,
  applicationNumber,
  schoolName = "School",
  paymentMethod,
  paymentReference,
  applicationFeePaid,
}: SuccessContentProps) {
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string
  const id = params.id as string

  // Access the success dictionary
  const successDict =
    (
      dictionary as unknown as {
        school?: {
          admission?: { apply?: { success?: Record<string, string> } }
        }
      }
    )?.school?.admission?.apply?.success ?? {}

  const paymentDict =
    (
      dictionary as unknown as {
        school?: {
          admission?: { payment?: Record<string, string> }
        }
      }
    )?.school?.admission?.payment ?? {}

  // Helper to replace {schoolName} placeholder
  const thankYouText = (
    successDict.thankYou || "Thank you for applying to {schoolName}"
  ).replace("{schoolName}", schoolName)

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">
            {successDict.title || "Application Submitted!"}
          </h1>
          <p className="text-muted-foreground mt-2">{thankYouText}</p>
        </div>

        {applicationNumber && (
          <Card className="mb-6">
            <CardHeader className="pb-2 text-center">
              <CardDescription>
                {successDict.applicationNumber || "Application Number"}
              </CardDescription>
              <CardTitle className="font-mono text-2xl">
                {applicationNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">
                {successDict.saveNumber ||
                  "Please save this number for future reference"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payment Status Section */}
        {paymentMethod && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Banknote className="text-primary h-5 w-5" />
                {paymentDict.paymentStatus || "Payment Status"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationFeePaid ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">
                      {paymentDict.paymentConfirmed || "Payment Confirmed"}
                    </p>
                    <Badge variant="default" className="mt-1">
                      {paymentDict.paid || "Paid"}
                    </Badge>
                  </div>
                </div>
              ) : paymentMethod === "cash" ? (
                <div className="flex items-start gap-3">
                  <Clock className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-medium">
                      {paymentDict.paymentPendingCash ||
                        "Payment Pending — Please pay at school"}
                    </p>
                    {paymentReference && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {paymentDict.referenceLabel || "Reference: "}
                        <span className="font-mono font-medium">
                          {paymentReference}
                        </span>
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {paymentDict.cashAtSchool || "Cash at School"}
                    </Badge>
                  </div>
                </div>
              ) : paymentMethod === "bank_transfer" ? (
                <div className="flex items-start gap-3">
                  <Clock className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-medium">
                      {paymentDict.transferPending ||
                        "Transfer Pending Confirmation"}
                    </p>
                    {paymentReference && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {paymentDict.referenceLabel || "Reference: "}
                        <span className="font-mono font-medium">
                          {paymentReference}
                        </span>
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {paymentDict.bankTransfer || "Bank Transfer"}
                    </Badge>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {successDict.nextSteps || "Next Steps"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-sm font-medium">1</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {successDict.emailConfirmation || "Email Confirmation"}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {successDict.emailConfirmationDesc ||
                    "You will receive an email confirming your application receipt"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-sm font-medium">2</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {successDict.applicationReview || "Application Review"}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {successDict.applicationReviewDesc ||
                    "Our admissions team will review your application within 5-7 business days"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-sm font-medium">3</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {successDict.interview || "Interview / Assessment"}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {successDict.interviewDesc ||
                    "You will be contacted to schedule an interview or assessment"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-sm font-medium">4</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {successDict.finalDecision || "Final Decision"}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {successDict.finalDecisionDesc ||
                    "You will receive the admission decision via email"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href={`/${locale}/s/${subdomain}/apply/status`}>
            <Card className="hover:border-primary h-full cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 pt-6">
                <FileText className="text-primary h-8 w-8" />
                <div>
                  <h4 className="font-medium">
                    {successDict.trackStatus || "Track Application Status"}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {successDict.checkStatus || "Check your application status"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/s/${subdomain}/tour`}>
            <Card className="hover:border-primary h-full cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 pt-6">
                <Calendar className="text-primary h-8 w-8" />
                <div>
                  <h4 className="font-medium">
                    {successDict.scheduleTour || "Schedule a School Tour"}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {successDict.visitCampus || "Visit our campus"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href={`/${locale}`}>
            <Button variant="outline">
              {successDict.backToHome || "Back to Home"}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>

        <div className="text-muted-foreground mt-8 text-center text-sm">
          <p>
            {successDict.questions || "Have questions? Contact us at"}{" "}
            <a
              href={`mailto:admissions@${subdomain}.edu`}
              className="text-primary hover:underline"
            >
              admissions@{subdomain}.edu
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
