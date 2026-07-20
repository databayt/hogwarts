// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Certificate Verification Page
 * Public-facing page to verify certificate authenticity
 */

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { verifyCertificate } from "@/components/school-dashboard/exams/certificates/actions"

interface VerifyPageProps {
  params: Promise<{
    code: string
    lang: Locale
  }>
}

export default async function CertificateVerifyPage({
  params,
}: VerifyPageProps) {
  const { code, lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.exams?.certificateVerify
  const result = await verifyCertificate({ code })

  // Public page: pin the calendar + zone so the server and client agree.
  const formatDate = (value: Date | string) =>
    new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(value))

  if (!result.success) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="bg-destructive/10 rounded-full p-4">
          <svg
            className="text-destructive h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">{d?.notFoundTitle}</h2>
        <p className="text-muted-foreground max-w-md text-center text-sm">
          {d?.notFoundDesc}
        </p>
      </div>
    )
  }

  const cert = result.data!
  const statusLabels = d?.status as
    | Record<string, string | undefined>
    | undefined

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-green-100 p-4">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">{d?.verifiedTitle}</h2>
        <p className="text-muted-foreground text-sm">{d?.verifiedDesc}</p>
        <p className="text-muted-foreground text-sm">
          {d?.statusLabel}:{" "}
          <span className="font-medium">
            {statusLabels?.[cert.status?.toLowerCase()] ?? cert.status}
          </span>
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-muted-foreground text-sm">{d?.recipient}</dt>
            <dd className="text-lg font-medium">{cert.recipientName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{d?.exam}</dt>
            <dd className="font-medium">{cert.examTitle}</dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground text-sm">{d?.score}</dt>
              <dd className="font-medium">{cert.score.toFixed(1)}%</dd>
            </div>
            {cert.grade && (
              <div>
                <dt className="text-muted-foreground text-sm">{d?.grade}</dt>
                <dd className="font-medium">{cert.grade}</dd>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground text-sm">{d?.examDate}</dt>
              <dd className="font-medium">{formatDate(cert.examDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">{d?.issued}</dt>
              <dd className="font-medium">{formatDate(cert.issuedAt)}</dd>
            </div>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{d?.school}</dt>
            <dd className="font-medium">{cert.schoolName}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
