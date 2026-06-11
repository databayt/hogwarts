// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { Download, FileText } from "lucide-react"

import { db } from "@/lib/db"
import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  studentId: string
  lang: Locale
  dictionary?: Dictionary
}

/**
 * Parent-facing list of published report cards for one child.
 *
 * Phase 1 surfaces the read-only list with view-online button when `pdfUrl`
 * is present. Phase 2b switches the link target to `/api/parent/report-cards/
 * [id]/download` (signed-URL gate) and adds a true Download button.
 */
export async function ParentReportCardsContent({
  studentId,
  lang,
  dictionary,
}: Props) {
  const t = dictionary?.parentPortal?.reportCards
  const isRTL = lang === "ar"

  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) return null

  // Relationship gate — confirm this guardian is linked to this student.
  // The action layer already checks this, but doing it here too keeps the
  // page defensible if it's ever rendered from a different caller.
  const guardian = await db.guardian.findFirst({
    where: { userId: session!.user!.id!, schoolId },
    select: { id: true },
  })
  const link = guardian
    ? await db.studentGuardian.findFirst({
        where: { schoolId, guardianId: guardian.id, studentId },
        select: { id: true },
      })
    : null

  if (!link) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t?.noAccess ??
          (isRTL
            ? "ليس لديك صلاحية لعرض بطاقات تقرير هذا الطالب."
            : "You don't have access to this student's report cards.")}
      </p>
    )
  }

  const rows = await db.reportCard.findMany({
    where: { schoolId, studentId, isPublished: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      overallGrade: true,
      overallGPA: true,
      rank: true,
      totalStudents: true,
      pdfUrl: true,
      publishedAt: true,
      term: { select: { termNumber: true } },
    },
  })

  // Defense in depth: never let the raw S3 URL reach the client HTML.
  // The Download button hits `/api/parent/report-cards/[id]/download`
  // which signs the URL with a short TTL. We only forward a boolean.
  const reportCards = rows.map((rc) => ({
    id: rc.id,
    overallGrade: rc.overallGrade,
    overallGPA: rc.overallGPA,
    rank: rc.rank,
    totalStudents: rc.totalStudents,
    hasPdf: !!rc.pdfUrl,
    publishedAt: rc.publishedAt,
    term: rc.term,
  }))

  if (reportCards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {t?.title ?? (isRTL ? "بطاقات التقرير" : "Report cards")}
          </CardTitle>
          <CardDescription>
            {t?.emptyDescription ??
              (isRTL
                ? "لم يتم نشر أي بطاقات تقرير بعد. ستظهر هنا عند نشرها من قبل المدرسة."
                : "No report cards published yet. They will appear here once the school publishes them.")}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {t?.published ??
          (isRTL ? "بطاقات التقرير المنشورة" : "Published report cards")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {reportCards.map((rc) => {
          const termLabel = rc.term
            ? `${t?.term ?? (isRTL ? "الفصل" : "Term")} ${rc.term.termNumber}`
            : (t?.reportCard ?? (isRTL ? "بطاقة تقرير" : "Report card"))
          return (
            <Card key={rc.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      {termLabel}
                    </CardTitle>
                    <CardDescription>
                      {rc.publishedAt ? formatDate(rc.publishedAt, lang) : null}
                    </CardDescription>
                  </div>
                  {rc.overallGrade ? (
                    <Badge variant="outline">{rc.overallGrade}</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="text-muted-foreground text-sm">
                  {rc.overallGPA !== null && rc.overallGPA !== undefined ? (
                    <span>
                      {t?.gpa ?? (isRTL ? "المعدل" : "GPA")}:{" "}
                      <strong className="text-foreground">
                        {Number(rc.overallGPA).toFixed(2)}
                      </strong>
                    </span>
                  ) : null}
                  {rc.rank ? (
                    <span className="ms-3">
                      {t?.rank ?? (isRTL ? "الترتيب" : "Rank")}:{" "}
                      <strong className="text-foreground">
                        {rc.rank}
                        {rc.totalStudents ? ` / ${rc.totalStudents}` : ""}
                      </strong>
                    </span>
                  ) : null}
                </div>
                {rc.hasPdf ? (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`/api/parent/report-cards/${rc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="me-1 h-4 w-4" />
                      {t?.download ?? (isRTL ? "تنزيل" : "Download")}
                    </a>
                  </Button>
                ) : (
                  <Badge variant="secondary">
                    {t?.preparingPdf ??
                      (isRTL ? "جاري التحضير" : "Preparing PDF")}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
