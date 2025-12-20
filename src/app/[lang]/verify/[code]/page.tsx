/**
 * Certificate Verification Page
 * Public page to verify a certificate by code
 */

import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  GraduationCap,
  School,
  Shield,
  User,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import { verifyCertificate } from "@/components/platform/exams/certificates/actions"

interface VerifyPageProps {
  params: Promise<{
    lang: Locale
    code: string
  }>
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { lang, code } = await params
  const isRtl = lang === "ar"
  const dateLocale = isRtl ? ar : enUS

  const result = await verifyCertificate({ verificationCode: code })

  // Error state
  if (!result.success) {
    return (
      <div className="container mx-auto max-w-lg py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-4 rounded-full p-4">
              <XCircle className="text-destructive h-12 w-12" />
            </div>
            <CardTitle className="text-destructive">
              {isRtl ? "خطأ في التحقق" : "Verification Error"}
            </CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Invalid certificate
  if (!result.data.isValid) {
    return (
      <div className="container mx-auto max-w-lg py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-amber-100 p-4">
              <AlertTriangle className="h-12 w-12 text-amber-600" />
            </div>
            <CardTitle className="text-amber-600">
              {isRtl ? "شهادة غير صالحة" : "Invalid Certificate"}
            </CardTitle>
            <CardDescription>
              {result.data.error ||
                (isRtl
                  ? "لم يتم العثور على الشهادة أو أنها غير صالحة"
                  : "Certificate not found or is not valid")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Valid certificate
  const cert = result.data.certificate!

  return (
    <div className="container mx-auto max-w-lg py-12">
      <Card>
        {/* Header */}
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-green-600">
            {isRtl ? "شهادة صالحة" : "Valid Certificate"}
          </CardTitle>
          <CardDescription>
            {isRtl
              ? "تم التحقق من صحة هذه الشهادة بنجاح"
              : "This certificate has been verified successfully"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Certificate Number */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-muted-foreground mb-1 text-sm">
              {isRtl ? "رقم الشهادة" : "Certificate Number"}
            </p>
            <p className="font-mono text-lg font-bold">
              {cert.certificateNumber}
            </p>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {isRtl ? "المستلم" : "Recipient"}
                </p>
                <p className="font-medium">{cert.recipientName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GraduationCap className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {isRtl ? "الامتحان" : "Exam"}
                </p>
                <p className="font-medium">{cert.examTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <School className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {isRtl ? "المؤسسة" : "Institution"}
                </p>
                <p className="font-medium">{cert.schoolName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Award className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {isRtl ? "النتيجة" : "Score"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cert.score.toFixed(1)}%</span>
                  {cert.grade && <Badge variant="outline">{cert.grade}</Badge>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {isRtl ? "تاريخ الامتحان" : "Exam Date"}
                </p>
                <p className="font-medium">
                  {format(new Date(cert.examDate), "PPP", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {isRtl ? "تاريخ الإصدار" : "Issue Date"}
                </p>
                <p className="font-medium">
                  {format(new Date(cert.issuedAt), "PPP", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
            </div>

            {cert.expiresAt && (
              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">
                    {isRtl ? "تاريخ الانتهاء" : "Expiry Date"}
                  </p>
                  <p className="font-medium">
                    {format(new Date(cert.expiresAt), "PPP", {
                      locale: dateLocale,
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center justify-center">
            <Badge
              variant={cert.status === "active" ? "default" : "secondary"}
              className="px-4 py-2 text-sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {cert.status === "active"
                ? isRtl
                  ? "شهادة صالحة ونشطة"
                  : "Valid and Active"
                : cert.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
