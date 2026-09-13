// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"
import { addDays, differenceInDays, format } from "date-fns"
import {
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  FileBarChart,
  GraduationCap,
  Sparkles,
} from "lucide-react"

import { db } from "@/lib/db"
import { formatDate } from "@/lib/i18n-format"
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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  AppTileGrid,
  BrandBanner,
  BrandPill,
  DateTile,
  ListRow,
  ListRows,
  SectionHeader,
} from "@/components/school-dashboard/shared"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function StudentExamsContent({ dictionary, lang }: Props) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const userId = session?.user?.id

  if (!schoolId || !userId) return null

  // Get student record and enrolled classes
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!student) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GraduationCap className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">
            {dictionary?.school?.exams?.studentContent?.noRecord ??
              "No student record found"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {dictionary?.school?.exams?.studentContent?.contactAdmin ??
              "Please contact school administration"}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Get enrolled class IDs and subject IDs
  const enrolledClasses = await db.studentClass.findMany({
    where: { studentId: student.id, schoolId },
    include: {
      class: {
        select: {
          id: true,
          subjectId: true,
          subject: { select: { name: true, lang: true } },
          name: true,
          lang: true,
        },
      },
    },
  })

  const classIds = enrolledClasses.map((sc) => sc.classId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch upcoming exams + recent results in parallel
  const [upcomingExams, recentResults] = await Promise.all([
    db.schoolExam.findMany({
      where: {
        schoolId,
        classId: { in: classIds },
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        examDate: { gte: today },
      },
      include: {
        class: { select: { name: true, lang: true } },
        subject: { select: { name: true, lang: true } },
      },
      orderBy: { examDate: "asc" },
      take: 10,
    }),
    db.examResult.findMany({
      where: {
        schoolId,
        studentId: student.id,
      },
      include: {
        exam: {
          select: {
            title: true,
            examDate: true,
            totalMarks: true,
            subject: { select: { name: true, lang: true } },
            class: { select: { name: true, lang: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  // ONE batched translation pass for the page: exam titles via localize,
  // subject/class labels via deduped getLabels (replaces N×getText).
  const [localizedUpcoming, localizedResultExams, labels] = await Promise.all([
    localize("Exam", upcomingExams, { schoolId, lang }),
    localize(
      "Exam",
      recentResults.map((r) => r.exam),
      { schoolId, lang }
    ),
    getLabels(
      [
        ...upcomingExams.flatMap((e) => [e.subject?.name, e.class?.name]),
        ...recentResults.map((r) => r.exam.subject?.name),
      ],
      lang,
      schoolId
    ),
  ])
  const results = recentResults.map((r, i) => ({
    ...r,
    exam: localizedResultExams[i] ?? r.exam,
  }))

  const d = dictionary?.school?.exams

  // Phone copy that used to be inline `lang === "ar"` ternaries. Kept as the
  // same two literals for now, in ONE place, until the keys exist.
  const t = {
    myUpcoming: lang === "ar" ? "امتحاناتي القادمة" : "My Upcoming Exams",
    myResults: lang === "ar" ? "نتائجي الأخيرة" : "My Recent Results",
    viewAll: lang === "ar" ? "عرض الكل" : "View All",
    today: lang === "ar" ? "اليوم" : "Today",
    tomorrow: lang === "ar" ? "غداً" : "Tomorrow",
    days: lang === "ar" ? "أيام" : "days",
    minutes: d?.minutes || (lang === "ar" ? "د" : "min"),
  }
  const weekdayOf = (date: Date) => formatDate(date, lang, { weekday: "short" })
  const dayOf = (date: Date) => formatDate(date, lang, { day: "numeric" })
  const whenOf = (daysUntil: number) =>
    daysUntil === 0
      ? t.today
      : daysUntil === 1
        ? t.tomorrow
        : `${daysUntil} ${t.days}`
  const next = localizedUpcoming[0]
  const nextDays = next ? differenceInDays(next.examDate, today) : 0
  const nextSubject = next?.subject?.name
    ? (labels.get(next.subject.name) ?? next.subject.name)
    : ""

  return (
    <>
      {/* Phone: the next exam as the green banner, the section's doors as
          tiles, then two lists of rows with a calendar tile for each date. */}
      <div className="space-y-8 md:hidden">
        <BrandBanner
          eyebrow={
            next
              ? `${d?.upcomingExams || t.myUpcoming} · ${whenOf(nextDays)}`
              : undefined
          }
          actions={
            <>
              <BrandPill href={`/${lang}/exams/quiz`}>
                {d?.nav?.quiz || "Quiz"}
              </BrandPill>
              <BrandPill href={`/${lang}/exams/qbank`} variant="ghost">
                {d?.dashboard?.blocks?.qbank?.title || "Practice"}
              </BrandPill>
            </>
          }
        >
          {next ? (
            <>
              <strong className="font-bold">{next.title}</strong>
              <span className="mt-1 block text-lg">
                {nextSubject ? `${nextSubject} · ` : ""}
                {formatDate(next.examDate, lang, {
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </>
          ) : (
            <strong className="font-bold">
              {d?.studentContent?.noUpcoming ?? "No upcoming exams scheduled"}
            </strong>
          )}
        </BrandBanner>

        <AppTileGrid
          items={[
            {
              key: "upcoming",
              label: d?.dashboard?.stats?.upcoming || "Upcoming",
              href: `/${lang}/exams/upcoming`,
              // Not the "schedule" PNG: its calendar face has "Tue 1" baked
              // in, in English. Today's date, in the reader's language.
              face: (
                <DateTile
                  weekday={weekdayOf(new Date())}
                  day={dayOf(new Date())}
                />
              ),
              badge: upcomingExams.length,
            },
            {
              key: "results",
              label: d?.dashboard?.blocks?.results?.title || "Results",
              href: `/${lang}/exams/result`,
              art: "grades",
            },
            {
              key: "qbank",
              label: d?.dashboard?.blocks?.qbank?.title || "Practice",
              href: `/${lang}/exams/qbank`,
              icon: BookOpen,
              tint: "indigo",
            },
            {
              key: "quiz",
              label: d?.nav?.quiz || "Quiz",
              href: `/${lang}/exams/quiz`,
              icon: Sparkles,
              tint: "orange",
            },
          ]}
        />

        {localizedUpcoming.length > 0 ? (
          <section>
            <SectionHeader
              title={t.myUpcoming}
              href={`/${lang}/exams/upcoming`}
              linkLabel={t.viewAll}
            />
            <ListRows>
              {localizedUpcoming.map((exam) => {
                const daysUntil = differenceInDays(exam.examDate, today)
                const subject = exam.subject?.name
                  ? (labels.get(exam.subject.name) ?? exam.subject.name)
                  : ""
                return (
                  <ListRow
                    key={exam.id}
                    art={
                      <DateTile
                        weekday={weekdayOf(exam.examDate)}
                        day={dayOf(exam.examDate)}
                      />
                    }
                    title={exam.title}
                    badge={
                      <Badge
                        variant={daysUntil === 0 ? "destructive" : "secondary"}
                        className="font-normal"
                      >
                        {whenOf(daysUntil)}
                      </Badge>
                    }
                    description={subject || undefined}
                    meta={
                      exam.startTime ? (
                        <span className="tabular-nums">
                          {exam.startTime} · {exam.duration} {t.minutes}
                        </span>
                      ) : undefined
                    }
                  />
                )
              })}
            </ListRows>
          </section>
        ) : null}

        <section>
          <SectionHeader
            title={t.myResults}
            href={`/${lang}/exams/result`}
            linkLabel={t.viewAll}
          />
          {results.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {d?.studentContent?.noResults ?? "No results yet"}
            </p>
          ) : (
            <ListRows divided>
              {results.map((result) => {
                const subject = result.exam.subject?.name
                  ? (labels.get(result.exam.subject.name) ??
                    result.exam.subject.name)
                  : ""
                return (
                  <ListRow
                    key={result.id}
                    title={result.exam.title}
                    description={[
                      subject,
                      formatDate(result.exam.examDate, lang, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    trailing={
                      <div className="flex items-center gap-2">
                        <div className="text-end">
                          <p className="text-lg leading-6 font-bold">
                            {result.percentage.toFixed(0)}%
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {result.marksObtained}/{result.exam.totalMarks}
                          </p>
                        </div>
                        {result.grade ? (
                          <Badge
                            variant={
                              result.percentage >= 80
                                ? "default"
                                : result.percentage >= 50
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {result.grade}
                          </Badge>
                        ) : null}
                      </div>
                    }
                  />
                )
              })}
            </ListRows>
          )}
        </section>
      </div>

      <div className="hidden space-y-8 md:block">
        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <Link
                href={`/${lang}/exams/upcoming`}
                className="flex items-center gap-3"
              >
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">
                    {d?.dashboard?.stats?.upcoming || "Upcoming"}
                  </p>
                  <p className="text-muted-foreground text-2xl font-bold">
                    {upcomingExams.length}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <Link
                href={`/${lang}/exams/result`}
                className="flex items-center gap-3"
              >
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <FileBarChart className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">
                    {d?.dashboard?.blocks?.results?.title || "Results"}
                  </p>
                  <p className="text-muted-foreground text-2xl font-bold">
                    {recentResults.length}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <Link
                href={`/${lang}/exams/qbank`}
                className="flex items-center gap-3"
              >
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">
                    {d?.dashboard?.blocks?.qbank?.title || "Practice"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {d?.dashboard?.blocks?.qbank?.browse || "Browse"}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <Link
                href={`/${lang}/exams/quiz`}
                className="flex items-center gap-3"
              >
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">{d?.nav?.quiz || "Quiz"}</p>
                  <p className="text-muted-foreground text-sm">
                    {lang === "ar" ? "تدريب سريع" : "Quick practice"}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Exams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {lang === "ar" ? "امتحاناتي القادمة" : "My Upcoming Exams"}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/exams/upcoming`}>
                {lang === "ar" ? "عرض الكل" : "View All"}
                <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          {upcomingExams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="text-muted-foreground mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  {d?.studentContent?.noUpcoming ??
                    "No upcoming exams scheduled"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {localizedUpcoming.map((exam) => {
                const daysUntil = differenceInDays(exam.examDate, today)
                const name = exam.subject?.name
                  ? (labels.get(exam.subject.name) ?? exam.subject.name)
                  : ""
                const className = exam.class?.name
                  ? (labels.get(exam.class.name) ?? exam.class.name)
                  : ""

                return (
                  <Card
                    key={exam.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {exam.title}
                        </CardTitle>
                        <Badge
                          variant={
                            daysUntil === 0
                              ? "destructive"
                              : daysUntil === 1
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {daysUntil === 0
                            ? lang === "ar"
                              ? "اليوم"
                              : "Today"
                            : daysUntil === 1
                              ? lang === "ar"
                                ? "غداً"
                                : "Tomorrow"
                              : `${daysUntil} ${lang === "ar" ? "أيام" : "days"}`}
                        </Badge>
                      </div>
                      <CardDescription>
                        {name} - {className}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(exam.examDate, "MMM d")}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exam.startTime} ({exam.duration} min)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {lang === "ar" ? "نتائجي الأخيرة" : "My Recent Results"}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/exams/result`}>
                {lang === "ar" ? "عرض الكل" : "View All"}
                <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          {recentResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileBarChart className="text-muted-foreground mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  {d?.studentContent?.noResults ?? "No results yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {results.map((result) => {
                const name = result.exam.subject?.name
                  ? (labels.get(result.exam.subject.name) ??
                    result.exam.subject.name)
                  : ""

                return (
                  <Card key={result.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{result.exam.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {name} - {format(result.exam.examDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <p className="text-2xl font-bold">
                            {result.percentage.toFixed(0)}%
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {result.marksObtained}/{result.exam.totalMarks}
                          </p>
                        </div>
                        {result.grade && (
                          <Badge
                            variant={
                              result.percentage >= 80
                                ? "default"
                                : result.percentage >= 50
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {result.grade}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
