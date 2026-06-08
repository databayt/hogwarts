// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Public Certificate Share Page
 *
 * Reached via an unguessable share token. Shows the certificate's
 * metadata and embeds the ALREADY-RENDERED PDF (uploaded to S3 with
 * public access) via an <iframe>. It deliberately does NOT import the
 * React-PDF renderer or the composable template — pulling those into a
 * public route is what broke the build and forced the earlier stub.
 * The PDF is produced server-side (by the cert-PDF action/cron); this
 * page only displays `pdfUrl`.
 */

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getCertificateByShareToken } from "@/components/school-dashboard/exams/certificates/actions"

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
  const dictionary = await getDictionary(lang)
  const d = dictionary?.certificate?.share

  const cert = await getCertificateByShareToken(shareToken)

  // Unknown token, expired share, revoked, or non-public → generic
  // "unavailable" (don't leak whether the id ever existed).
  if (!cert) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {d?.unavailableTitle ?? "Certificate Unavailable"}
            </CardTitle>
            <CardDescription>
              {d?.unavailableDescription ??
                "This certificate is no longer available or the share link has expired."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  // Cert exists but the PDF hasn't been rendered yet (cron pending).
  if (!cert.pdfUrl) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {d?.generatingTitle ?? "Certificate Is Being Prepared"}
            </CardTitle>
            <CardDescription>
              {d?.generatingDescription ??
                "The certificate document is being generated. Please check back in a moment."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto w-full max-w-3xl space-y-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{cert.recipientName}</CardTitle>
            <CardDescription>
              {cert.examTitle} · {d?.issuedBy ?? "Issued by"}{" "}
              {cert.school?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background overflow-hidden rounded-lg border">
              <iframe
                src={cert.pdfUrl}
                title={d?.title ?? "Certificate"}
                className="h-[60vh] w-full"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                {d?.verifyHint ?? "Verify authenticity with code"}:{" "}
                <span className="font-mono">{cert.verificationCode}</span>
              </p>
              <Button asChild>
                <a
                  href={cert.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  {d?.download ?? "Download Certificate"}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-muted-foreground text-center text-xs">
          <Link href={`/${lang}/verify/${cert.verificationCode}`}>
            {cert.certificateNumber}
          </Link>
        </p>
      </div>
    </main>
  )
}
