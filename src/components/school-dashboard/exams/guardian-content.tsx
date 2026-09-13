// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"
import { differenceInDays } from "date-fns"
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  FileBarChart,
  Users,
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
  DateTile,
  ListRow,
  ListRows,
  SectionHeader,
  StatPanel,
} from "@/components/school-dashboard/shared"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function GuardianExamsContent({
  dictionary,
  lang,
}: Props) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const userId = session?.user?.id

  if (!schoolId || !userId) return null

  // Get guardian record
  const guardian = await db.guardian.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!guardian) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">
            {dictionary?.school?.exams?.guardianContent?.noRecord ??
              "No guardian record found"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {dictionary?.school?.exams?.guardianContent?.contactAdmin ??
              "Please contact school administration"}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Get children via StudentGuardian bridge
  const studentGuardians = await db.studentGuardian.findMany({
    where: { guardianId: guardian.id, schoolId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          user: { select: { username: true } },
        },
      },
    },
  })

  const children = studentGuardians.map((sg) => sg.student)

  if (children.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">
            {dictionary?.school?.exams?.guardianContent?.noLinkedStudents ??
              "No linked students found"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {dictionary?.school?.exams?.guardianContent?.linkStudents ??
              "Please contact school admin to link your children"}
          </p>
        </CardContent>
      </Card>
    )
  }

  const childIds = children.map((c) => c.id)

  // Get all enrolled classes for all children
  const enrolledClasses = await db.studentClass.findMany({
    where: { studentId: { in: childIds }, schoolId },
    select: { classId: true, studentId: true },
  })
  const classIds = [...new Set(enrolledClasses.map((sc) => sc.classId))]

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch upcoming exams + recent results for all children in parallel
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
        studentId: { in: childIds },
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        exam: {
          select: {
            title: true,
            examDate: true,
            totalMarks: true,
            subject: { select: { name: true, lang: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ])

  const d = dictionary?.school?.exams

  // Phone: one batched label pass for both lists (the desktop below runs its
  // own inline passes, left as they were).
  const phoneLabels = await getLabels(
    [
      ...upcomingExams.map((e) => e.subject?.name),
      ...recentResults.map((r) => r.exam.subject?.name),
    ],
    lang,
    schoolId!
  )
  const subjectOf = (name?: string | null) =>
    name ? (phoneLabels.get(name) ?? name) : ""
  // The guardian's exams home copy lives in `results.examsHome`.
  const h = dictionary?.results?.examsHome
  const t = {
    children: h?.children ?? "",
    upcoming: h?.upcoming ?? "",
    results: h?.recentResults ?? "",
    viewAll: h?.viewAll ?? "",
    today: h?.today ?? "",
    avg: h?.average ?? "",
  }
  const daysOf = (count: number) =>
    (h?.daysCount ?? "{count}").replace("{count}", String(count))
  const averageOf = (childId: string) => {
    const rows = recentResults.filter((r) => r.studentId === childId)
    return rows.length > 0
      ? Math.round(rows.reduce((sum, r) => sum + r.percentage, 0) / rows.length)
      : null
  }

  return (
    <>
      {/* Phone: the family's figures as one grey panel with each child's
          average in it, the doors as tiles, then the dated lists as rows. */}
      <div className="space-y-8 md:hidden">
        <StatPanel
          items={[
            {
              key: "upcoming",
              label: d?.dashboard?.stats?.upcoming || "Upcoming",
              value: upcomingExams.length,
              href: `/${lang}/exams/upcoming`,
            },
            {
              key: "results",
              label: d?.dashboard?.blocks?.results?.title || "Results",
              value: recentResults.length,
              href: `/${lang}/exams/result`,
            },
            ...children.map((child) => {
              const avg = averageOf(child.id)
              return {
                key: child.id,
                label: `${child.firstName} ${child.lastName}`,
                value: avg === null ? "—" : `${avg}%`,
                hint: t.avg,
                tone:
                  avg === null
                    ? ("default" as const)
                    : avg >= 80
                      ? ("positive" as const)
                      : avg >= 50
                        ? ("default" as const)
                        : ("negative" as const),
              }
            }),
          ]}
        />

        <AppTileGrid
          items={[
            {
              key: "upcoming",
              label: d?.dashboard?.stats?.upcoming || "Upcoming",
              href: `/${lang}/exams/upcoming`,
              face: (
                <DateTile
                  weekday={formatDate(new Date(), lang, { weekday: "short" })}
                  day={formatDate(new Date(), lang, { day: "numeric" })}
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
              label: d?.dashboard?.blocks?.qbank?.title || "Question Bank",
              href: `/${lang}/exams/qbank`,
              icon: BookOpen,
              tint: "indigo",
            },
          ]}
        />

        <section>
          <SectionHeader
            title={t.upcoming}
            href={`/${lang}/exams/upcoming`}
            linkLabel={t.viewAll}
          />
          {upcomingExams.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {d?.guardianContent?.noUpcoming ?? "No upcoming exams"}
            </p>
          ) : (
            <ListRows>
              {upcomingExams.map((exam) => {
                const daysUntil = differenceInDays(exam.examDate, today)
                return (
                  <ListRow
                    key={exam.id}
                    art={
                      <DateTile
                        weekday={formatDate(exam.examDate, lang, {
                          weekday: "short",
                        })}
                        day={formatDate(exam.examDate, lang, {
                          day: "numeric",
                        })}
                      />
                    }
                    title={exam.title}
                    badge={
                      <Badge
                        variant={daysUntil === 0 ? "destructive" : "secondary"}
                        className="font-normal"
                      >
                        {daysUntil === 0 ? t.today : daysOf(daysUntil)}
                      </Badge>
                    }
                    description={subjectOf(exam.subject?.name) || undefined}
                    meta={
                      exam.startTime ? (
                        <span className="tabular-nums">{exam.startTime}</span>
                      ) : undefined
                    }
                  />
                )
              })}
            </ListRows>
          )}
        </section>

        <section>
          <SectionHeader
            title={t.results}
            href={`/${lang}/exams/result`}
            linkLabel={t.viewAll}
          />
          {recentResults.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {d?.guardianContent?.noResults ?? "No results yet"}
            </p>
          ) : (
            <ListRows divided>
              {recentResults.map((result) => (
                <ListRow
                  key={result.id}
                  title={result.exam.title}
                  description={[
                    `${result.student.firstName} ${result.student.lastName}`,
                    subjectOf(result.exam.subject?.name),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  meta={formatDate(result.exam.examDate, lang, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
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
              ))}
            </ListRows>
          )}
        </section>
      </div>

      <div className="hidden space-y-8 md:block">
        {/* Children Overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">{t.children}</p>
                  <p className="text-2xl font-bold">{children.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Link
                href={`/${lang}/exams/upcoming`}
                className="flex items-center gap-3"
              >
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {d?.dashboard?.stats?.upcoming || "Upcoming"}
                  </p>
                  <p className="text-2xl font-bold">{upcomingExams.length}</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Link
                href={`/${lang}/exams/result`}
                className="flex items-center gap-3"
              >
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <FileBarChart className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {d?.dashboard?.blocks?.results?.title || "Results"}
                  </p>
                  <p className="text-2xl font-bold">{recentResults.length}</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Link
                href={`/${lang}/exams/qbank`}
                className="flex items-center gap-3"
              >
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {d?.dashboard?.blocks?.qbank?.title || "Question Bank"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {d?.dashboard?.blocks?.qbank?.browse || "Browse"}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Children Cards */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{h?.myChildren}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => {
              const childResults = recentResults.filter(
                (r) => r.studentId === child.id
              )
              const avgScore =
                childResults.length > 0
                  ? childResults.reduce((sum, r) => sum + r.percentage, 0) /
                    childResults.length
                  : null

              return (
                <Card key={child.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {child.firstName} {child.lastName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {(h?.resultsCount ?? "{count}").replace(
                            "{count}",
                            String(childResults.length)
                          )}
                        </p>
                      </div>
                      {avgScore !== null && (
                        <Badge
                          variant={
                            avgScore >= 80
                              ? "default"
                              : avgScore >= 50
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {t.avg} {avgScore.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.upcoming}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/exams/upcoming`}>
                {t.viewAll}
                <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          {upcomingExams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="text-muted-foreground mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  {d?.guardianContent?.noUpcoming ?? "No upcoming exams"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {await (async () => {
                // Batched, deduped subject-name translation (no per-row N+1).
                const subjectLabels = await getLabels(
                  upcomingExams.map((e) => e.subject?.name),
                  lang,
                  schoolId!
                )
                return upcomingExams.map((exam) => {
                  const daysUntil = differenceInDays(exam.examDate, today)
                  const name = exam.subject?.name
                    ? (subjectLabels.get(exam.subject.name) ??
                      exam.subject.name)
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
                                : daysUntil <= 2
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {daysUntil === 0 ? t.today : daysOf(daysUntil)}
                          </Badge>
                        </div>
                        <CardDescription>{name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(exam.examDate, lang, {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {exam.startTime} ({exam.duration} min)
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              })()}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.results}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/exams/result`}>
                {t.viewAll}
                <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          {recentResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileBarChart className="text-muted-foreground mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  {d?.guardianContent?.noResults ?? "No results yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {await (async () => {
                // Batched, deduped subject-name translation (no per-row N+1).
                const resultLabels = await getLabels(
                  recentResults.map((r) => r.exam.subject?.name),
                  lang,
                  schoolId!
                )
                return recentResults.map((result) => {
                  const name = result.exam.subject?.name
                    ? (resultLabels.get(result.exam.subject.name) ??
                      result.exam.subject.name)
                    : ""

                  return (
                    <Card key={result.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{result.exam.title}</p>
                          <p className="text-muted-foreground text-sm">
                            {result.student.firstName} {result.student.lastName}{" "}
                            - {name} -{" "}
                            {formatDate(result.exam.examDate, lang, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
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
                })
              })()}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
