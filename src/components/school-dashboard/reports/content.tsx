// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"
import { Download, Eye, FileText, GraduationCap, Send } from "lucide-react"

import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
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
import { Ltr } from "@/components/atom/ltr"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { GenerateWithTemplateButton } from "../documents/generate-with-template-button"
import { ReportCardShareButton } from "../grades/report-cards/share-button"
import { TemplateBulkButton } from "../grades/report-cards/template-bulk-button"
import { GenerateButton } from "./generate-button"
import { PublishButton } from "./publish-button"

const PAGE_SIZE = 50

export async function ReportCardsContent({
  locale,
  dictionary,
  termId,
  page = 1,
}: {
  locale: Locale
  dictionary: Dictionary
  termId?: string
  page?: number
}) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role

  if (!schoolId) return null

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

  // One page of the term's cards; the stats count the whole term in the
  // database instead of loading every card (975 rows on a mid-size school).
  const where = { schoolId, termId: activeTerm.id }
  const [total, published, withPdf, unpublished] = await Promise.all([
    db.reportCard.count({ where }),
    db.reportCard.count({ where: { ...where, isPublished: true } }),
    db.reportCard.count({ where: { ...where, pdfUrl: { not: null } } }),
    db.reportCard.findMany({
      where: { ...where, isPublished: false },
      select: { id: true },
    }),
  ])
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), pageCount)
  const reportCards = await db.reportCard.findMany({
    where,
    include: {
      student: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          studentId: true,
          grNumber: true,
        },
      },
      grades: {
        include: { subject: { select: { name: true } } },
      },
    },
    orderBy: [{ student: { firstName: "asc" } }, { id: "asc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const nameDisplay = await schoolNameDisplay(schoolId)
  const pageHref = (p: number) =>
    `/${locale}/grades/reports?termId=${activeTerm.id}&page=${p}`

  // Grades and their sections — generation can be narrowed to either
  const grades = await db.academicGrade.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      sections: {
        where: { schoolId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { gradeNumber: "asc" },
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
          <Link key={t.id} href={`/${locale}/grades/reports?termId=${t.id}`}>
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
          {copy && (
            <GenerateButton
              termId={activeTerm.id}
              grades={grades}
              copy={copy}
            />
          )}
          {total > 0 && <TemplateBulkButton termId={activeTerm.id} />}
          {total > 0 && published < total && (
            <PublishButton reportCardIds={unpublished.map((r) => r.id)} />
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
                      <bdi dir="auto">
                        {displayName(rc.student, nameDisplay)}
                      </bdi>
                    </TableCell>
                    <TableCell>
                      <Ltr>
                        {rc.student.studentId ?? rc.student.grNumber ?? "—"}
                      </Ltr>
                    </TableCell>
                    <TableCell>{rc.grades.length}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Ltr>{rc.overallGrade ?? "—"}</Ltr>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Ltr>
                        {rc.overallGPA ? Number(rc.overallGPA).toFixed(2) : "—"}
                      </Ltr>
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
                        {canManage && rc.isPublished && (
                          <ReportCardShareButton
                            reportCardId={rc.id}
                            isPublic={rc.isPublic}
                            studentName={displayName(rc.student, nameDisplay)}
                          />
                        )}
                        {canManage && (
                          <GenerateWithTemplateButton
                            category="REPORT_CARD"
                            entityId={rc.id}
                            variant="ghost"
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pageCount > 1 && (
              <nav className="flex items-center justify-between gap-2 pt-4 text-sm">
                <span className="text-muted-foreground">
                  {(copy?.pageOf ?? "{page} / {count}")
                    .replace("{page}", String(currentPage))
                    .replace("{count}", String(pageCount))}
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={pageHref(currentPage - 1)}>
                        {copy?.previous}
                      </Link>
                    </Button>
                  )}
                  {currentPage < pageCount && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={pageHref(currentPage + 1)}>{copy?.next}</Link>
                    </Button>
                  )}
                </div>
              </nav>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
