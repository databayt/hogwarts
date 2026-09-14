// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"
import { Download, Eye, FileText, GraduationCap, Send } from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { GenerateButton } from "./generate-button"
import { PublishButton } from "./publish-button"

export async function ReportCardsContent({
  locale,
  dictionary,
  termId,
}: {
  locale: Locale
  dictionary: Dictionary
  termId?: string
}) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role

  if (!schoolId) {
    return <div>Unauthorized</div>
  }

  const canManage = ["DEVELOPER", "ADMIN", "TEACHER"].includes(role || "")
  const copy = dictionary?.results?.reportCards

  // Fetch terms for selector
  const terms = await db.term.findMany({
    where: { schoolId },
    include: { schoolYear: { select: { yearName: true } } },
    orderBy: [{ schoolYear: { startDate: "desc" } }, { termNumber: "desc" }],
  })

  // Use active term or first term if none specified
  const activeTerm = termId
    ? terms.find((t) => t.id === termId)
    : (terms.find((t) => t.isActive) ?? terms[0])

  if (!activeTerm) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">{copy?.noTerms}</p>
        </CardContent>
      </Card>
    )
  }

  // Fetch existing report cards for this term
  const reportCards = await db.reportCard.findMany({
    where: { schoolId, termId: activeTerm.id },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          studentId: true,
        },
      },
      grades: {
        include: { subject: { select: { name: true } } },
      },
    },
    orderBy: { student: { firstName: "asc" } },
  })

  // Stats
  const total = reportCards.length
  const published = reportCards.filter((r) => r.isPublished).length
  const withPdf = reportCards.filter((r) => r.pdfUrl).length

  // Fetch classes for this term (for generation)
  const classes = await db.class.findMany({
    where: { schoolId, termId: activeTerm.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const termName = (t: (typeof terms)[number], template?: string) =>
    (template ?? "{year} · {term} {number}")
      .replace("{year}", t.schoolYear.yearName)
      .replace("{term}", copy?.filters?.term ?? "")
      .replace("{number}", String(t.termNumber))

  // Phone: the three stat cards are one grey panel, two across with hairlines
  // (the third spans the row); every class below md is `max-md:`.
  const statCard =
    "p-4 max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0"

  return (
    <div className="space-y-6">
      {/* Term selector */}
      <div className="flex flex-wrap items-center gap-3">
        {terms.map((t) => (
          <Link
            key={t.id}
            href={`/${locale}/exams/report-cards?termId=${t.id}`}
          >
            <Badge
              variant={t.id === activeTerm.id ? "default" : "outline"}
              className="cursor-pointer"
            >
              {termName(t, copy?.termBadge)}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Stats cards */}
      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-3 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className={statCard}>
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-5 w-5 max-md:hidden" />
            <div>
              <p className="text-muted-foreground text-sm max-md:text-xs">
                {copy?.stats?.total}
              </p>
              <p className="text-2xl font-bold max-md:text-lg max-md:tabular-nums">
                {total}
              </p>
            </div>
          </div>
        </Card>
        <Card className={statCard}>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600 max-md:hidden" />
            <div>
              <p className="text-muted-foreground text-sm max-md:text-xs">
                {copy?.stats?.published}
              </p>
              <p className="text-2xl font-bold max-md:text-lg max-md:tabular-nums">
                {published}
              </p>
            </div>
          </div>
        </Card>
        <Card className={statCard}>
          <div className="flex items-center gap-2">
            <Download className="text-muted-foreground h-5 w-5 max-md:hidden" />
            <div>
              <p className="text-muted-foreground text-sm max-md:text-xs">
                {copy?.stats?.pdfReady}
              </p>
              <p className="text-2xl font-bold max-md:text-lg max-md:tabular-nums">
                {withPdf}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex flex-wrap items-center gap-2 max-md:[&_button]:h-10 max-md:[&_button]:rounded-full max-md:[&_button]:px-5">
          <GenerateButton termId={activeTerm.id} classes={classes} />
          {total > 0 && published < total && (
            <PublishButton
              reportCardIds={reportCards
                .filter((r) => !r.isPublished)
                .map((r) => r.id)}
            />
          )}
        </div>
      )}

      {/* Report cards table */}
      {total === 0 ? (
        <Card className="max-md:bg-muted max-md:border-0">
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-2 max-md:text-center">
            <GraduationCap className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground">{copy?.emptyTerm}</p>
            {canManage && (
              <p className="text-muted-foreground text-sm">
                {copy?.emptyManage}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="max-md:bg-muted max-md:border-0">
          <CardHeader className="max-md:p-4">
            <CardTitle className="max-md:text-base">
              {termName(activeTerm, copy?.tableTitle)}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-2 max-md:pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy?.columns?.student}</TableHead>
                  <TableHead>{copy?.columns?.studentId}</TableHead>
                  <TableHead>{copy?.columns?.subjects}</TableHead>
                  <TableHead>{copy?.columns?.grade}</TableHead>
                  <TableHead>{copy?.columns?.gpa}</TableHead>
                  <TableHead>{copy?.columns?.status}</TableHead>
                  <TableHead>{copy?.columns?.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportCards.map((rc) => (
                  <TableRow key={rc.id}>
                    <TableCell className="font-medium">
                      {rc.student.firstName} {rc.student.lastName}
                    </TableCell>
                    <TableCell>{rc.student.studentId ?? "—"}</TableCell>
                    <TableCell>{rc.grades.length}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {rc.overallGrade ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rc.overallGPA ? Number(rc.overallGPA).toFixed(2) : "—"}
                    </TableCell>
                    <TableCell>
                      {rc.isPublished ? (
                        <Badge variant="default">
                          {copy?.status?.published}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{copy?.status?.draft}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {rc.pdfUrl && (
                          <Button asChild variant="ghost" size="sm">
                            <a
                              href={rc.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {rc.pdfUrl && (
                          <Button asChild variant="ghost" size="sm">
                            <a href={rc.pdfUrl} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
