// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { BadgeCheck, ShieldAlert } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

import { verifyTranscript } from "../actions/transcripts"

interface Props {
  code: string
  lang: Locale
}

/**
 * Public-facing verification surface.
 *
 * Renders nothing beyond what's already on the printed transcript —
 * student name, school, transcript number, cumulative GPA, total
 * credits, issue date. The verification code itself is the auth
 * token; if you know it, you've seen the document.
 */
export async function TranscriptVerifyContent({ code, lang }: Props) {
  const isRTL = lang === "ar"
  const result = await verifyTranscript({ verificationCode: code })

  if (!result.valid || !result.data) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card className="border-destructive/40">
          <CardHeader className="items-center text-center">
            <div className="bg-destructive/10 text-destructive mb-2 flex h-12 w-12 items-center justify-center rounded-full">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle>
              {isRTL ? "تعذر التحقق" : "Verification failed"}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? "لم يتم العثور على شهادة بهذا الرمز. قد يكون الرمز خاطئًا أو الشهادة قد تم إلغاؤها."
                : "We could not find a transcript with this code. The code may be incorrect or the transcript may have been revoked."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const data = result.data

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <CardTitle>{isRTL ? "شهادة موثقة" : "Verified transcript"}</CardTitle>
          <CardDescription>
            {isRTL
              ? "هذه الشهادة صادرة عن المدرسة وغير معدّلة."
              : "This transcript was issued by the school and is unaltered."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-border divide-y text-sm">
            <Row
              label={isRTL ? "الطالب" : "Student"}
              value={data.studentName}
            />
            <Row
              label={isRTL ? "المدرسة" : "School"}
              value={data.schoolName ?? "—"}
            />
            <Row
              label={isRTL ? "رقم الشهادة" : "Transcript number"}
              value={
                <Badge variant="outline" className="font-mono text-xs">
                  {data.transcriptNumber}
                </Badge>
              }
            />
            {data.cumulativeGPA !== null ? (
              <Row
                label={isRTL ? "المعدل التراكمي" : "Cumulative GPA"}
                value={data.cumulativeGPA.toFixed(2)}
              />
            ) : null}
            {data.totalCredits !== null ? (
              <Row
                label={isRTL ? "إجمالي الساعات" : "Total credits"}
                value={String(data.totalCredits)}
              />
            ) : null}
            <Row
              label={isRTL ? "تاريخ الإصدار" : "Issued"}
              value={formatDate(new Date(data.issuedDate), lang)}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  )
}
