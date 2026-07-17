// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { Award } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
}

export function StreamCertificateContent({
  dictionary,
  lang,
  certificate,
}: Props) {
  const d = dictionary?.certificate
  // Locale-aware date — the rest of the block formats dates this way rather
  // than leaking an en-US string onto /ar.
  const completed = new Intl.DateTimeFormat(lang === "ar" ? "ar-SD" : "en-GB", {
    dateStyle: "long",
  }).format(certificate.completedAt)

  const learner = certificate.user.username || ""

  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card>
        <CardContent className="space-y-6 py-10 text-center">
          <div className="flex justify-center">
            <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
              <Award className="text-primary size-8" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              {d?.title || "Certificate of Completion"}
            </h1>
            {certificate.school?.name && (
              <p className="muted">{certificate.school.name}</p>
            )}
          </div>

          {learner && <p className="text-xl font-semibold">{learner}</p>}

          <p className="text-2xl font-bold">{certificate.subjectTitle}</p>

          <div className="text-muted-foreground space-y-1 text-sm">
            <p>
              {d?.completed || "Completed:"} {completed}
            </p>
            <p>
              {d?.certificateNumber || "Certificate #:"}{" "}
              {certificate.certificateNumber}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/${lang}/stream/courses`}
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
