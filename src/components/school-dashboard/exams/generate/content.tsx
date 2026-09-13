// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  AlertCircle,
  Clock,
  FileText,
  Hash,
  Plus,
  Printer,
  Sparkles,
  Wand2,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { TemplateDistribution } from "./types"
import { calculateTotalQuestions } from "./utils"

interface Props {
  dictionary: Dictionary
  lang: Locale
  error?: string
}

export default async function GenerateContent({
  dictionary,
  lang,
  error,
}: Props) {
  const isAr = lang === "ar"
  const { schoolId } = await getTenantContext()

  let templates: {
    id: string
    name: string
    subjectName: string
    duration: number
    totalMarks: number
    totalQuestions: number
    timesUsed: number
    isActive: boolean
  }[] = []

  let generatedExams: {
    id: string
    examTitle: string
    templateName: string | null
    name: string
    totalQuestions: number
    createdAt: string
    examId: string
  }[] = []

  const gc = dictionary?.school?.exams?.generateContent

  if (schoolId) {
    const [templateRows, generatedRows] = await Promise.all([
      db.schoolExamTemplate.findMany({
        where: { schoolId, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 12,
        include: {
          subject: { select: { name: true } },
          _count: { select: { generatedExams: true } },
        },
      }),
      db.generatedExam.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          exam: {
            select: {
              title: true,
              subject: { select: { name: true } },
            },
          },
          template: { select: { name: true } },
        },
      }),
    ])

    templates = templateRows.map((t) => ({
      id: t.id,
      name: t.name,
      subjectName: t.subject?.name ?? gc?.unknown ?? "Unknown",
      duration: t.duration,
      totalMarks: Number(t.totalMarks),
      totalQuestions: calculateTotalQuestions(
        t.distribution as TemplateDistribution
      ),
      timesUsed: t._count.generatedExams,
      isActive: t.isActive,
    }))

    generatedExams = generatedRows.map((g) => ({
      id: g.id,
      examTitle: g.exam.title,
      templateName: g.template?.name || null,
      name: g.exam.subject?.name ?? gc?.unknown ?? "Unknown",
      totalQuestions: g.totalQuestions,
      createdAt: g.createdAt.toISOString(),
      examId: g.examId,
    }))
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Section 1: Templates Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {gc?.examTemplates ?? "Exam Templates"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {gc?.reusableBlueprints ??
                "Reusable blueprints for exam generation"}
            </p>
          </div>
          <Button asChild className="max-md:rounded-full">
            <Link href={`/${lang}/exams/generate/catalog`}>
              <Wand2 className="me-2 h-4 w-4" />
              {gc?.newTemplate ?? "New Template"}
            </Link>
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card className="max-md:bg-muted border-dashed max-md:border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="text-muted-foreground mb-4 h-10 w-10" />
              <p className="text-muted-foreground mb-4 text-sm">
                {gc?.noTemplatesYet ??
                  "No templates yet. Create your first template to get started."}
              </p>
              <Button asChild variant="outline">
                <Link href={`/${lang}/exams/generate/catalog`}>
                  <Plus className="me-2 h-4 w-4" />
                  {gc?.createTemplate ?? "Create Template"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 max-md:grid-cols-2 max-md:gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/${lang}/exams/generate/templates/${t.id}`}
                className="group"
              >
                <Card className="group-hover:border-primary/50 max-md:bg-muted h-full transition-colors max-md:border-0">
                  <CardHeader className="pb-3 max-md:p-4 max-md:pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1 text-base max-md:line-clamp-2 max-md:text-sm max-md:leading-5">
                        {t.name}
                      </CardTitle>
                      {/* The badge repeats the name; two across there is no
                          room for the same words twice. */}
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs max-md:hidden"
                      >
                        {t.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 max-md:space-y-2 max-md:px-4 max-md:pb-4">
                    <div className="text-muted-foreground flex flex-wrap gap-3 text-sm max-md:gap-x-2 max-md:gap-y-1 max-md:text-xs">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" />
                        {t.totalQuestions} {gc?.questions ?? "Q"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {t.duration} {gc?.min ?? "min"}
                      </span>
                      <span>
                        {t.totalMarks} {gc?.marks ?? "marks"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">
                        {gc?.used ?? "Used"} {t.timesUsed}{" "}
                        {gc?.times ?? "times"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {templates.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="max-md:bg-muted max-md:h-10 max-md:rounded-full max-md:px-5"
            >
              <Link href={`/${lang}/exams/generate/templates`}>
                {gc?.viewAllTemplates ?? "View All Templates"}
              </Link>
            </Button>
          </div>
        )}
      </section>

      <Separator className="max-md:hidden" />

      {/* Section 2: Generated Exams Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {gc?.generatedExams ?? "Generated Exams"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {gc?.examsReadyToPrint ??
                "Exams ready to print or use as mock exams"}
            </p>
          </div>
          <Button asChild variant="secondary" className="max-md:rounded-full">
            <Link href={`/${lang}/exams/generate/add`}>
              <Sparkles className="me-2 h-4 w-4" />
              {gc?.generateExam ?? "Generate Exam"}
            </Link>
          </Button>
        </div>

        {generatedExams.length === 0 ? (
          <Card className="max-md:bg-muted border-dashed max-md:border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="text-muted-foreground mb-4 h-10 w-10" />
              <p className="text-muted-foreground mb-4 text-sm">
                {gc?.noGeneratedExams ??
                  "No generated exams yet. Create a template first, then generate an exam."}
              </p>
              <Button asChild variant="outline">
                <Link href={`/${lang}/exams/generate/add`}>
                  <Sparkles className="me-2 h-4 w-4" />
                  {gc?.generateExam ?? "Generate Exam"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 max-md:grid-cols-2 max-md:gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {generatedExams.map((g) => (
              <Card
                key={g.id}
                className="max-md:bg-muted h-full max-md:flex max-md:flex-col max-md:border-0"
              >
                <CardHeader className="pb-3 max-md:space-y-1 max-md:p-4 max-md:pb-2">
                  {/* Two across, the subject chip goes under the title
                      instead of squeezing it to one word. */}
                  <div className="flex items-start justify-between max-md:flex-col max-md:gap-1.5">
                    <CardTitle className="line-clamp-1 text-base max-md:line-clamp-2 max-md:text-sm max-md:leading-5">
                      {g.examTitle}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="max-md:bg-background shrink-0 text-xs max-md:max-w-full max-md:truncate"
                    >
                      {g.name}
                    </Badge>
                  </div>
                  {g.templateName && (
                    <CardDescription className="text-xs max-md:line-clamp-1">
                      {gc?.template ?? "Template:"} {g.templateName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 max-md:mt-auto max-md:space-y-2 max-md:px-4 max-md:pb-4">
                  <div className="text-muted-foreground flex flex-wrap gap-3 text-sm max-md:gap-x-2 max-md:gap-y-1 max-md:text-xs">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      {g.totalQuestions} {gc?.questions ?? "Q"}
                    </span>
                    <span className="text-xs">
                      {new Date(g.createdAt).toLocaleDateString(
                        isAr ? "ar-SA" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2 max-md:gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="max-md:bg-background h-7 flex-1 text-xs max-md:h-8 max-md:rounded-full max-md:border-0 max-md:px-2"
                      asChild
                    >
                      <Link href={`/${lang}/exams/paper/${g.id}/preview`}>
                        <Printer className="me-1 h-3 w-3" />
                        {gc?.print ?? "Print"}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 text-xs max-md:h-8 max-md:rounded-full max-md:px-2"
                      asChild
                    >
                      <Link href={`/${lang}/exams/${g.examId}`}>
                        {gc?.details ?? "Details"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {generatedExams.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="max-md:bg-muted max-md:h-10 max-md:rounded-full max-md:px-5"
            >
              <Link href={`/${lang}/exams/generate/list`}>
                {gc?.viewAllGenerated ?? "View All Generated Exams"}
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
