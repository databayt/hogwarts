// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  Clock,
  FileText,
  Hash,
  Plus,
  Printer,
  Sparkles,
  Wand2,
} from "lucide-react"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
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
import type { SupportedLanguage } from "@/components/translation/types"

import type { TemplateDistribution } from "./types"
import { calculateTotalQuestions } from "./utils"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function GenerateContent({ dictionary, lang }: Props) {
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
    subjectName: string
    totalQuestions: number
    createdAt: string
    examId: string
  }[] = []

  if (schoolId) {
    const [templateRows, generatedRows] = await Promise.all([
      db.examTemplate.findMany({
        where: { schoolId, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 12,
        include: {
          subject: { select: { subjectName: true, lang: true } },
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
              subject: { select: { subjectName: true, lang: true } },
            },
          },
          template: { select: { name: true } },
        },
      }),
    ])

    templates = await Promise.all(
      templateRows.map(async (t) => ({
        id: t.id,
        name: t.name,
        subjectName: t.subject?.subjectName
          ? await getDisplayText(
              t.subject.subjectName,
              (t.subject.lang || "ar") as SupportedLanguage,
              lang,
              schoolId
            )
          : lang === "ar"
            ? "غير محدد"
            : "Unknown",
        duration: t.duration,
        totalMarks: Number(t.totalMarks),
        totalQuestions: calculateTotalQuestions(
          t.distribution as TemplateDistribution
        ),
        timesUsed: t._count.generatedExams,
        isActive: t.isActive,
      }))
    )

    generatedExams = await Promise.all(
      generatedRows.map(async (g) => ({
        id: g.id,
        examTitle: g.exam.title,
        templateName: g.template?.name || null,
        subjectName: g.exam.subject?.subjectName
          ? await getDisplayText(
              g.exam.subject.subjectName,
              (g.exam.subject.lang || "ar") as SupportedLanguage,
              lang,
              schoolId
            )
          : lang === "ar"
            ? "غير محدد"
            : "Unknown",
        totalQuestions: g.totalQuestions,
        createdAt: g.createdAt.toISOString(),
        examId: g.examId,
      }))
    )
  }

  const isAr = lang === "ar"

  return (
    <div className="space-y-8">
      {/* Section 1: Templates Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {isAr ? "قوالب الاختبارات" : "Exam Templates"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "قوالب قابلة لإعادة الاستخدام لإنشاء الاختبارات"
                : "Reusable blueprints for exam generation"}
            </p>
          </div>
          <Button asChild>
            <Link href={`/${lang}/exams/generate/template-wizard`}>
              <Wand2 className="me-2 h-4 w-4" />
              {isAr ? "قالب جديد" : "New Template"}
            </Link>
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="text-muted-foreground mb-4 h-10 w-10" />
              <p className="text-muted-foreground mb-4 text-sm">
                {isAr
                  ? "لا توجد قوالب بعد. أنشئ أول قالب للبدء."
                  : "No templates yet. Create your first template to get started."}
              </p>
              <Button asChild variant="outline">
                <Link href={`/${lang}/exams/generate/template-wizard`}>
                  <Plus className="me-2 h-4 w-4" />
                  {isAr ? "إنشاء قالب" : "Create Template"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/${lang}/exams/generate/templates/${t.id}`}
                className="group"
              >
                <Card className="group-hover:border-primary/50 h-full transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1 text-base">
                        {t.name}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {t.subjectName}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" />
                        {t.totalQuestions} {isAr ? "سؤال" : "Q"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {t.duration} {isAr ? "د" : "min"}
                      </span>
                      <span>
                        {t.totalMarks} {isAr ? "درجة" : "marks"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">
                        {isAr ? "استخدم" : "Used"} {t.timesUsed}{" "}
                        {isAr ? "مرة" : "times"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/${lang}/exams/generate/template-wizard?configId=${t.id}`}
                        >
                          {isAr ? "تخصيص" : "Customize"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {templates.length > 0 && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/exams/generate/templates`}>
                {isAr ? "عرض الكل" : "View All Templates"}
              </Link>
            </Button>
          </div>
        )}
      </section>

      <Separator />

      {/* Section 2: Generated Exams Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {isAr ? "الاختبارات المُنشأة" : "Generated Exams"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "اختبارات جاهزة للطباعة أو الاستخدام كاختبار تجريبي"
                : "Exams ready to print or use as mock exams"}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/${lang}/exams/generate/exam-wizard`}>
              <Sparkles className="me-2 h-4 w-4" />
              {isAr ? "إنشاء اختبار" : "Generate Exam"}
            </Link>
          </Button>
        </div>

        {generatedExams.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="text-muted-foreground mb-4 h-10 w-10" />
              <p className="text-muted-foreground mb-4 text-sm">
                {isAr
                  ? "لا توجد اختبارات مُنشأة. أنشئ قالبًا أولاً ثم ولّد اختبارًا."
                  : "No generated exams yet. Create a template first, then generate an exam."}
              </p>
              <Button asChild variant="outline">
                <Link href={`/${lang}/exams/generate/exam-wizard`}>
                  <Sparkles className="me-2 h-4 w-4" />
                  {isAr ? "إنشاء اختبار" : "Generate Exam"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generatedExams.map((g) => (
              <Card key={g.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1 text-base">
                      {g.examTitle}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {g.subjectName}
                    </Badge>
                  </div>
                  {g.templateName && (
                    <CardDescription className="text-xs">
                      {isAr ? "من قالب:" : "Template:"} {g.templateName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      {g.totalQuestions} {isAr ? "سؤال" : "Q"}
                    </span>
                    <span className="text-xs">
                      {new Date(g.createdAt).toLocaleDateString(
                        isAr ? "ar-SA" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      asChild
                    >
                      <Link href={`/${lang}/exams/paper/${g.id}/preview`}>
                        <Printer className="me-1 h-3 w-3" />
                        {isAr ? "طباعة" : "Print"}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      asChild
                    >
                      <Link href={`/${lang}/exams/${g.examId}`}>
                        {isAr ? "التفاصيل" : "Details"}
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
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/exams/generate/list`}>
                {isAr ? "عرض الكل" : "View All Generated Exams"}
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
