"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight, Calendar, CheckCircle2, FileText } from "lucide-react"

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
}

export default function SuccessContent({
  dictionary,
  applicationNumber,
  schoolName = "School",
}: SuccessContentProps) {
  const params = useParams()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
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

  // Helper to replace {schoolName} placeholder
  const thankYouText = (
    successDict.thankYou ||
    (isRTL
      ? "شكراً لتقديمك طلب الالتحاق بـ {schoolName}"
      : "Thank you for applying to {schoolName}")
  ).replace("{schoolName}", schoolName)

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">
            {successDict.title ||
              (isRTL ? "تم تقديم طلبك بنجاح!" : "Application Submitted!")}
          </h1>
          <p className="text-muted-foreground mt-2">{thankYouText}</p>
        </div>

        {applicationNumber && (
          <Card className="mb-6">
            <CardHeader className="pb-2 text-center">
              <CardDescription>
                {successDict.applicationNumber ||
                  (isRTL ? "رقم الطلب" : "Application Number")}
              </CardDescription>
              <CardTitle className="font-mono text-2xl">
                {applicationNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">
                {successDict.saveNumber ||
                  (isRTL
                    ? "يرجى الاحتفاظ بهذا الرقم للمراجع المستقبلية"
                    : "Please save this number for future reference")}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {successDict.nextSteps ||
                (isRTL ? "الخطوات التالية" : "Next Steps")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-sm font-medium">1</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {successDict.emailConfirmation ||
                    (isRTL ? "تأكيد البريد الإلكتروني" : "Email Confirmation")}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {successDict.emailConfirmationDesc ||
                    (isRTL
                      ? "ستتلقى بريداً إلكترونياً يؤكد استلام طلبك"
                      : "You will receive an email confirming your application receipt")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-sm font-medium">2</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {successDict.applicationReview ||
                    (isRTL ? "مراجعة الطلب" : "Application Review")}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {successDict.applicationReviewDesc ||
                    (isRTL
                      ? "سيقوم فريق القبول بمراجعة طلبك خلال 5-7 أيام عمل"
                      : "Our admissions team will review your application within 5-7 business days")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-sm font-medium">3</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {successDict.interview ||
                    (isRTL ? "المقابلة / الاختبار" : "Interview / Assessment")}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {successDict.interviewDesc ||
                    (isRTL
                      ? "سيتم التواصل معك لتحديد موعد المقابلة أو الاختبار"
                      : "You will be contacted to schedule an interview or assessment")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-sm font-medium">4</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {successDict.finalDecision ||
                    (isRTL ? "القرار النهائي" : "Final Decision")}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {successDict.finalDecisionDesc ||
                    (isRTL
                      ? "ستتلقى قرار القبول عبر البريد الإلكتروني"
                      : "You will receive the admission decision via email")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href={`/${locale}/apply/status`}>
            <Card className="hover:border-primary h-full cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 pt-6">
                <FileText className="text-primary h-8 w-8" />
                <div>
                  <h4 className="font-medium">
                    {successDict.trackStatus ||
                      (isRTL ? "تتبع حالة الطلب" : "Track Application Status")}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {successDict.checkStatus ||
                      (isRTL
                        ? "راجع حالة طلبك"
                        : "Check your application status")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/tour`}>
            <Card className="hover:border-primary h-full cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 pt-6">
                <Calendar className="text-primary h-8 w-8" />
                <div>
                  <h4 className="font-medium">
                    {successDict.scheduleTour ||
                      (isRTL
                        ? "حجز جولة في المدرسة"
                        : "Schedule a School Tour")}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {successDict.visitCampus ||
                      (isRTL ? "زر حرمنا الجامعي" : "Visit our campus")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href={`/${locale}`}>
            <Button variant="outline">
              {successDict.backToHome ||
                (isRTL ? "العودة إلى الصفحة الرئيسية" : "Back to Home")}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="text-muted-foreground mt-8 text-center text-sm">
          <p>
            {successDict.questions ||
              (isRTL
                ? "هل لديك أسئلة؟ تواصل معنا على"
                : "Have questions? Contact us at")}{" "}
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
