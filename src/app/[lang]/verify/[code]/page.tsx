// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Public Certificate Verification Page
 *
 * Anyone holding a certificate's verification code can confirm its
 * authenticity here — no auth, no school context. Renders ONLY plain
 * metadata returned by `verifyCertificate` (a DB-only server action);
 * it never imports the React-PDF renderer, so the public bundle stays
 * light (this is what the previous stub was avoiding).
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { verifyCertificate } from "@/components/school-dashboard/exams/certificates/actions"

interface VerifyPageProps {
  params: Promise<{
    lang: Locale
    code: string
  }>
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { lang, code } = await params
  const isRtl = lang === "ar"
  const dictionary = await getDictionary(lang)
  const d = dictionary?.certificate?.verify

  const result = await verifyCertificate({ code })

  if (!result.success || !result.data) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-2 rounded-full p-4">
              <svg
                className="text-destructive h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <CardTitle className="text-xl">
              {d?.notFoundTitle ?? "Certificate Not Found"}
            </CardTitle>
            <CardDescription>
              {d?.notFoundDescription ??
                "The verification code is invalid or the certificate has been revoked."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  const cert = result.data
  const statusLabel =
    cert.status === "revoked"
      ? (d?.statusRevoked ?? "This certificate has been revoked.")
      : cert.status === "expired"
        ? (d?.statusExpired ?? "This certificate has expired.")
        : (d?.statusActive ?? "This certificate is active.")

  const dateFmt = (value: Date | string) =>
    new Date(value).toLocaleDateString(isRtl ? "ar" : "en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 rounded-full bg-green-100 p-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">
            {d?.verifiedTitle ?? "Certificate Verified"}
          </CardTitle>
          <CardDescription>{statusLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4 rounded-lg border p-6">
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.recipient ?? "Recipient"}
              </dt>
              <dd className="text-lg font-medium">{cert.recipientName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.exam ?? "Exam"}
              </dt>
              <dd className="font-medium">{cert.examTitle}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground text-sm">
                  {d?.score ?? "Score"}
                </dt>
                <dd className="font-medium">{cert.score.toFixed(1)}%</dd>
              </div>
              {cert.grade && (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {d?.grade ?? "Grade"}
                  </dt>
                  <dd className="font-medium">{cert.grade}</dd>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground text-sm">
                  {d?.examDate ?? "Exam Date"}
                </dt>
                <dd className="font-medium">{dateFmt(cert.examDate)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">
                  {d?.issued ?? "Issued"}
                </dt>
                <dd className="font-medium">{dateFmt(cert.issuedAt)}</dd>
              </div>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {d?.school ?? "School"}
              </dt>
              <dd className="font-medium">{cert.schoolName}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </main>
  )
}
