"use client"

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
                {isRTL ? "جلسة غير صالحة" : "Invalid Session"}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
                {isRTL
                  ? "لم يتم العثور على معرف جلسة الدفع. يرجى المحاولة مرة أخرى."
                  : "No payment session ID found. Please try again."}
              </p>

              <Link
                href={`/${lang}/stream/courses`}
                className={buttonVariants({
                  variant: "outline",
                  className: "mt-5 w-full",
                })}
              >
                <ArrowIcon className="size-4" />
                {isRTL ? "تصفح الدورات" : "Browse Courses"}
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
                {isRTL ? "فشل التحقق من الدفع" : "Payment Verification Failed"}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
                {verificationResult?.error ||
                  (isRTL
                    ? "تعذر التحقق من الدفع. يرجى الاتصال بالدعم."
                    : "Could not verify your payment. Please contact support.")}
              </p>

              <div className="mt-5 space-y-2">
                <Link
                  href={`/${lang}/stream/courses`}
                  className={buttonVariants({ className: "w-full" })}
                >
                  <ArrowIcon className="size-4" />
                  {isRTL ? "تصفح الدورات" : "Browse Courses"}
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
              {isRTL ? "تم الدفع بنجاح!" : "Payment Successful!"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
              {isRTL
                ? `تهانينا! تم تفعيل اشتراكك في "${verificationResult.courseTitle}". يمكنك البدء بالتعلم الآن.`
                : `Congratulations! You are now enrolled in "${verificationResult.courseTitle}". You can start learning now.`}
            </p>

            <div className="mt-5 space-y-2">
              {verificationResult.courseSlug && (
                <Link
                  href={`/${lang}/stream/dashboard/${verificationResult.courseSlug}`}
                  className={buttonVariants({ className: "w-full" })}
                >
                  <ArrowIcon className="size-4" />
                  {isRTL ? "ابدأ التعلم" : "Start Learning"}
                </Link>
              )}
              <Link
                href={`/${lang}/stream/dashboard`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                {isRTL ? "لوحة التحكم" : "Go to Dashboard"}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
