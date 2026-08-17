// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { Award } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { CertificatePrintButton } from "./print-button"

interface Props {
  dictionary: Record<string, any>
  lang: string
  certificate: {
    certificateNumber: string
    subjectTitle: string
    completedAt: Date
    user: { username: string | null }
    school: { name: string } | null
  }
  /**
   * `subjectTitle` translated for the reader. The stored value is a snapshot in
   * the catalog's storage language taken at issuance, so an Arabic learner was
   * handed an English certificate (and vice versa) for the whole life of the
   * document. Falls back to the stored title when translation is unavailable.
   */
  displayTitle?: string
}

export function LumosCertificateContent({
  dictionary,
  lang,
  certificate,
  displayTitle,
}: Props) {
  const d = dictionary?.certificate
  // Locale-aware date — the rest of the block formats dates this way rather
  // than leaking an en-US string onto /ar.
  const completed = new Intl.DateTimeFormat(lang === "ar" ? "ar-SD" : "en-GB", {
    dateStyle: "long",
  }).format(certificate.completedAt)

  const learner = certificate.user.username || ""
  const title = displayTitle || certificate.subjectTitle

  return (
    <div className="mx-auto max-w-2xl py-10 print:max-w-none print:py-0">
      {/* Print drops the card's chrome: a bordered box with a drop shadow
          wastes a margin's worth of paper and prints as a grey frame. */}
      <Card className="print:border-0 print:shadow-none">
        <CardContent className="space-y-6 py-10 text-center">
          <div className="flex justify-center">
            <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
              <Award className="text-primary size-8" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2">
            <h1>{d?.title || "Certificate of Completion"}</h1>
            {certificate.school?.name && (
              <p className="muted">{certificate.school.name}</p>
            )}
          </div>

          {learner && <h3>{learner}</h3>}

          <h2>{title}</h2>

          <div className="text-muted-foreground space-y-1">
            <p>
              <small>
                {d?.completed || "Completed:"} {completed}
              </small>
            </p>
            <p>
              <small>
                {d?.certificateNumber || "Certificate #:"}{" "}
                {certificate.certificateNumber}
              </small>
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-2 print:hidden">
            <CertificatePrintButton label={d?.download || "Download"} />
            <Link
              href={`/${lang}/lumos/courses`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {dictionary?.courses?.title || "All Courses"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
