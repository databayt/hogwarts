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
          <p className="text-muted-foreground">
            No academic terms found. Set up terms in School Settings first.
          </p>
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
          givenName: true,
          surname: true,
          studentId: true,
        },
      },
      grades: {
        include: { subject: { select: { subjectName: true } } },
      },
    },
    orderBy: { student: { givenName: "asc" } },
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
              {t.schoolYear.yearName} - Term {t.termNumber}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">Total</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-muted-foreground text-sm">Published</p>
              <p className="text-2xl font-bold">{published}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Download className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">PDF Ready</p>
              <p className="text-2xl font-bold">{withPdf}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
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
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-2">
            <GraduationCap className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground">
              No report cards generated for this term yet.
            </p>
            {canManage && (
              <p className="text-muted-foreground text-sm">
                Use the &quot;Generate Report Cards&quot; button above to create
                them from exam results.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Report Cards - {activeTerm.schoolYear.yearName} Term{" "}
              {activeTerm.termNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportCards.map((rc) => (
                  <TableRow key={rc.id}>
                    <TableCell className="font-medium">
                      {rc.student.givenName} {rc.student.surname}
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
                        <Badge variant="default">Published</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
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
