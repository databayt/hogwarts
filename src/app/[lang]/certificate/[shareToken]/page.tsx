/**
 * Public Certificate View Page
 * STUB: Certificate features temporarily disabled due to build issues
 */

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

interface PublicCertificatePageProps {
  params: Promise<{
    lang: Locale
    shareToken: string
  }>
}

export default async function PublicCertificatePage({
  params,
}: PublicCertificatePageProps) {
  const { lang, shareToken } = await params
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
              ? "الشهادة غير متوفرة مؤقتاً"
              : "Certificate Temporarily Unavailable"}
          </CardTitle>
          <CardDescription>
            {isRtl
              ? "يتم صيانة نظام الشهادات. يرجى المحاولة لاحقاً."
              : "Certificate system is under maintenance. Please try again later."}
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}
