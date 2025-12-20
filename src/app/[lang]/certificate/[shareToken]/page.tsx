/**
 * Public Certificate View Page
 * View a shared certificate by share token
 */

import { AlertTriangle, Clock, Lock, XCircle } from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getPublicCertificate } from "@/components/platform/exams/certificates/actions"
import { renderCertificate } from "@/components/platform/exams/certificates/templates"

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

  const result = await getPublicCertificate({ shareToken })

  // Error states
  if (!result.success) {
    const errorConfig = getErrorConfig(result.code, isRtl)

    return (
      <div className="container mx-auto max-w-lg py-12">
        <Card>
          <CardHeader className="text-center">
            <div
              className={`mx-auto mb-4 rounded-full p-4 ${errorConfig.bgClass}`}
            >
              <errorConfig.icon
                className={`h-12 w-12 ${errorConfig.textClass}`}
              />
            </div>
            <CardTitle className={errorConfig.textClass}>
              {errorConfig.title}
            </CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Render the certificate
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-center">
        {renderCertificate(result.data, lang)}
      </div>
    </div>
  )
}

function getErrorConfig(code: string | undefined, isRtl: boolean) {
  switch (code) {
    case "NOT_FOUND":
      return {
        icon: XCircle,
        bgClass: "bg-destructive/10",
        textClass: "text-destructive",
        title: isRtl ? "الشهادة غير موجودة" : "Certificate Not Found",
      }
    case "NOT_PUBLIC":
      return {
        icon: Lock,
        bgClass: "bg-amber-100",
        textClass: "text-amber-600",
        title: isRtl ? "الشهادة غير متاحة للعامة" : "Certificate Not Public",
      }
    case "EXPIRED":
      return {
        icon: Clock,
        bgClass: "bg-amber-100",
        textClass: "text-amber-600",
        title: isRtl ? "انتهت صلاحية الرابط" : "Share Link Expired",
      }
    case "REVOKED":
      return {
        icon: AlertTriangle,
        bgClass: "bg-destructive/10",
        textClass: "text-destructive",
        title: isRtl ? "الشهادة ملغاة" : "Certificate Revoked",
      }
    default:
      return {
        icon: XCircle,
        bgClass: "bg-destructive/10",
        textClass: "text-destructive",
        title: isRtl ? "خطأ" : "Error",
      }
  }
}
