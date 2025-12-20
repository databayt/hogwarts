/**
 * Certificate Verification Page
 * STUB: Certificate features temporarily disabled due to build issues
 */

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

interface VerifyPageProps {
  params: Promise<{
    lang: Locale
    code: string
  }>
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { lang, code } = await params
  const isRtl = lang === "ar"

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isRtl
              ? "التحقق غير متوفر مؤقتاً"
              : "Verification Temporarily Unavailable"}
          </CardTitle>
          <CardDescription>
            {isRtl
              ? "يتم صيانة نظام التحقق. يرجى المحاولة لاحقاً."
              : "Verification system is under maintenance. Please try again later."}
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}
