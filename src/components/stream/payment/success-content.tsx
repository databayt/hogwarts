"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckIcon, XCircle } from "lucide-react"

import { useConfetti } from "@/hooks/use-confetti"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface VerificationResult {
  success: boolean
  error?: string
  message?: string
  courseSlug?: string
  courseTitle?: string
  paymentStatus?: string
}

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  sessionId?: string
  verificationResult: VerificationResult | null
}

export function StreamPaymentSuccessContent({
  dictionary,
  lang,
  schoolId,
  sessionId,
  verificationResult,
}: Props) {
  const triggerConfetti = useConfetti()
  const isRTL = lang === "ar"
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight
  const d = dictionary?.stream?.paymentSuccess

  useEffect(() => {
    // Only trigger confetti if payment was successful
    if (verificationResult?.success) {
      triggerConfetti()
    }
  }, [triggerConfetti, verificationResult?.success])

  // No session ID provided
  if (!sessionId) {
    return (
      <div className="flex min-h-screen w-full flex-1 items-center justify-center">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <div className="flex w-full justify-center">
              <XCircle className="size-12 text-amber-500" />
            </div>
            <div className="mt-3 w-full text-center sm:mt-5">
              <h2 className="text-xl font-semibold">
                {d?.invalidSession || "Invalid Session"}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
                {d?.noSessionFound ||
                  "No payment session ID found. Please try again."}
              </p>

              <Link
                href={`/${lang}/stream/courses`}
                className={buttonVariants({
                  variant: "outline",
                  className: "mt-5 w-full",
                })}
              >
                <ArrowIcon className="size-4" />
                {d?.browseCourses || "Browse Courses"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Payment verification failed
  if (!verificationResult?.success) {
    return (
      <div className="flex min-h-screen w-full flex-1 items-center justify-center">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <div className="flex w-full justify-center">
              <XCircle className="text-destructive size-12" />
            </div>
            <div className="mt-3 w-full text-center sm:mt-5">
              <h2 className="text-xl font-semibold">
                {d?.paymentVerificationFailed || "Payment Verification Failed"}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
                {verificationResult?.error ||
                  d?.couldNotVerify ||
                  "Could not verify your payment. Please contact support."}
              </p>

              <div className="mt-5 space-y-2">
                <Link
                  href={`/${lang}/stream/courses`}
                  className={buttonVariants({ className: "w-full" })}
                >
                  <ArrowIcon className="size-4" />
                  {d?.browseCourses || "Browse Courses"}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Payment successful - enrollment activated!
  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center">
      <Card className="w-[400px]">
        <CardContent className="pt-6">
          <div className="flex w-full justify-center">
            <CheckIcon className="size-12 rounded-full bg-green-500/30 p-2 text-green-500" />
          </div>
          <div className="mt-3 w-full text-center sm:mt-5">
            <h2 className="text-xl font-semibold">
              {d?.paymentSuccessful || "Payment Successful!"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
              {(
                d?.congratulations ||
                'Congratulations! You are now enrolled in "{title}". You can start learning now.'
              ).replace("{title}", verificationResult.courseTitle || "")}
            </p>

            <div className="mt-5 space-y-2">
              {verificationResult.courseSlug && (
                <Link
                  href={`/${lang}/stream/dashboard/${verificationResult.courseSlug}`}
                  className={buttonVariants({ className: "w-full" })}
                >
                  <ArrowIcon className="size-4" />
                  {d?.startLearning || "Start Learning"}
                </Link>
              )}
              <Link
                href={`/${lang}/stream/dashboard`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                {d?.goToDashboard || "Go to Dashboard"}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
