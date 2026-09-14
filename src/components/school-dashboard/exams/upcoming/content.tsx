// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ElementType } from "react"
import Link from "next/link"
import { auth } from "@/auth"
import { addDays, differenceInDays } from "date-fns"
import {
  BookOpen,
  Calendar,
  ChevronRight,
  CircleAlert,
  Clock,
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
import { getLabels } from "@/components/translation/person"

import type { CalendarExam } from "./calendar-view"
import { ViewToggle } from "./view-toggle"

// Short labels for exam types - keep badges compact
const examTypeLabels: Record<string, string> = {
  MIDTERM: "Mid",
  FINAL: "Final",
  QUIZ: "Quiz",
  TEST: "Test",
  ASSIGNMENT: "HW",
  HOMEWORK: "HW",
  PROJECT: "Proj",
  PRACTICAL: "Prac",
}

interface Props {
  dictionary: Dictionary
  lang: Locale
  catalogSubjectId?: string
}

export default async function UpcomingExamsContent({
  dictionary,
  lang,
  catalogSubjectId,
}: Props) {
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const role = session?.user?.role

  // For students/guardians, scope to enrolled classes
  let enrolledClassIds: string[] | null = null
  if (schoolId && role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId: session?.user?.id, schoolId },
      select: { id: true },
    })
    if (student) {
      const classes = await db.studentClass.findMany({
        where: { studentId: student.id, schoolId },
        select: { classId: true },
      })
      enrolledClassIds = classes.map((c) => c.classId)
    }
  } else if (schoolId && role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { userId: session?.user?.id, schoolId },
      select: { id: true },
    })
    if (guardian) {
      const sgs = await db.studentGuardian.findMany({
        where: { guardianId: guardian.id, schoolId },
        select: { studentId: true },
      })
      const classes = await db.studentClass.findMany({
        where: {
          studentId: { in: sgs.map((sg) => sg.studentId) },
          schoolId,
        },
        select: { classId: true },
      })
      enrolledClassIds = [...new Set(classes.map((c) => c.classId))]
    }
  }

  let upcomingExams: Array<{
    id: string
    title: string
    description: string | null
    examDate: Date
    startTime: string
    endTime: string
    duration: number
    totalMarks: number
    examType: string
    status: string
    className: string
    name: string
    daysUntil: number
  }> = []

  if (schoolId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const exams = await db.schoolExam.findMany({
      where: {
        schoolId,
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        examDate: { gte: today },
        ...(catalogSubjectId ? { catalogSubjectId } : {}),
        ...(enrolledClassIds ? { classId: { in: enrolledClassIds } } : {}),
      },
      include: {
        class: { select: { name: true, lang: true } },
        subject: { select: { name: true, lang: true } },
      },
      orderBy: { examDate: "asc" },
      take: 30,
    })

    const displayLang = lang === "en" ? ("en" as const) : ("ar" as const)
    const [classLabels, subjectLabels] = await Promise.all([
      getLabels(
        exams.map((e) => e.class?.name).filter(Boolean) as string[],
        displayLang,
        schoolId!
      ),
      getLabels(
        exams.map((e) => e.subject?.name).filter(Boolean) as string[],
        displayLang,
        schoolId!
      ),
    ])

    upcomingExams = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      examDate: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      examType: exam.examType,
      status: exam.status,
      className: exam.class?.name
        ? (classLabels.get(exam.class.name) ?? exam.class.name)
        : "Unknown",
      name: exam.subject?.name
        ? (subjectLabels.get(exam.subject.name) ?? exam.subject.name)
        : "Unknown",
      daysUntil: differenceInDays(exam.examDate, today),
    }))
  }

  // Use exams dictionary
  const examDict = dictionary?.school?.exams
  const u = examDict?.upcoming
  const d = {
    labels: {
      today: u?.labels?.today ?? "Today",
      tomorrow: u?.labels?.tomorrow ?? "Tomorrow",
      daysLeft: u?.labels?.daysLeft ?? "days",
      marks: u?.labels?.marks ?? "marks",
    },
    stats: {
      total: u?.stats?.total ?? examDict?.upcomingExams ?? "Upcoming",
      today: u?.stats?.today ?? "Today",
      tomorrow: u?.stats?.tomorrow ?? "Tomorrow",
      thisWeek: u?.stats?.thisWeek ?? "This Week",
    },
    empty: {
      title: u?.noExams ?? "No Upcoming Exams",
      description:
        u?.noExamsDescription ??
        "There are no exams scheduled in the near future.",
    },
    sections: {
      today: u?.sections?.today ?? "Today's Exams",
      tomorrow: u?.sections?.tomorrow ?? "Tomorrow",
      thisWeek: u?.sections?.thisWeek ?? "This Week",
      later: u?.sections?.later ?? "Coming Up",
    },
    actions: {
      viewDetails:
        u?.actions?.viewDetails ?? examDict?.viewDetails ?? "View Details",
      scheduleExam:
        u?.actions?.scheduleExam ?? examDict?.createExam ?? "Schedule an Exam",
    },
  }

  // Group exams by urgency
  const todayExams = upcomingExams.filter((e) => e.daysUntil === 0)
  const tomorrowExams = upcomingExams.filter((e) => e.daysUntil === 1)
  const thisWeekExams = upcomingExams.filter(
    (e) => e.daysUntil > 1 && e.daysUntil <= 7
  )
  const laterExams = upcomingExams.filter((e) => e.daysUntil > 7)

  const getUrgencyVariant = (
    daysUntil: number
  ): "destructive" | "secondary" | "outline" => {
    if (daysUntil === 0) return "destructive"
    if (daysUntil === 1) return "secondary"
    return "outline"
  }

  const getUrgencyLabel = (daysUntil: number) => {
    if (daysUntil === 0) return d?.labels?.today || "Today"
    if (daysUntil === 1) return d?.labels?.tomorrow || "Tomorrow"
    const daysText = d?.labels?.daysLeft || "days"
    if (daysUntil <= 7) return `${daysUntil} ${daysText}`
    return formatDate(addDays(new Date(), daysUntil), lang, {
      month: "short",
      day: "numeric",
    })
  }

  const ExamCard = ({ exam }: { exam: (typeof upcomingExams)[0] }) => (
    <Card className="max-md:bg-muted transition-shadow hover:shadow-md max-md:border-0 max-md:hover:shadow-none">
      <CardHeader className="pb-3 max-md:p-4 max-md:pb-2">
        <div className="flex items-start justify-between max-md:flex-col max-md:gap-1.5">
          <div className="space-y-1">
            <CardTitle className="text-lg max-md:line-clamp-2 max-md:text-sm max-md:leading-5">
              {exam.title}
            </CardTitle>
            <CardDescription className="max-md:line-clamp-1 max-md:text-xs">
              {exam.className} - {exam.name}
            </CardDescription>
          </div>
          <Badge
            variant={getUrgencyVariant(exam.daysUntil)}
            // Only the grey "secondary" (tomorrow) tier needs the phone
            // contrast fix — destructive/outline already read on bg-muted.
            className={
              exam.daysUntil === 1 ? "max-md:bg-background" : undefined
            }
          >
            {getUrgencyLabel(exam.daysUntil)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-md:space-y-2 max-md:px-4 max-md:pb-4">
        <div className="grid grid-cols-2 gap-4 text-sm max-md:grid-cols-1 max-md:gap-1 max-md:text-xs">
          <div className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(exam.examDate, lang, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {exam.startTime} - {exam.endTime} ({exam.duration} min)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between max-md:flex-wrap max-md:gap-2">
          <div className="flex items-center gap-4 text-sm max-md:gap-2 max-md:text-xs">
            <Badge variant="outline">
              {examTypeLabels[exam.examType] || exam.examType}
            </Badge>
            <span className="text-muted-foreground">
              {exam.totalMarks} {d?.labels?.marks || "marks"}
            </span>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="max-md:h-8 max-md:rounded-full max-md:px-3"
          >
            <Link href={`/${lang}/exams/${exam.id}`}>
              {d?.actions?.viewDetails || "View Details"}
              <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const ExamSection = ({
    title,
    exams,
    icon: Icon,
    urgent = false,
  }: {
    title: string
    exams: typeof upcomingExams
    icon: React.ElementType
    urgent?: boolean
  }) => {
    if (exams.length === 0) return null

    return (
      <div className="space-y-4">
        <div
          className={`flex items-center gap-2 ${urgent ? "text-destructive" : ""}`}
        >
          <Icon className="h-5 w-5" />
          <h2 className="font-semibold">
            {title} ({exams.length})
          </h2>
        </div>
        <div className="grid gap-4 max-md:grid-cols-2 max-md:gap-3 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-4 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.stats?.total || "Total Upcoming"}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {upcomingExams.length}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 ${todayExams.length > 0 ? "border-destructive" : ""}`}
        >
          <CardHeader className="pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.stats?.today || "Today"}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {todayExams.length}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 ${tomorrowExams.length > 0 ? "border-yellow-500" : ""}`}
        >
          <CardHeader className="pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.stats?.tomorrow || "Tomorrow"}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {tomorrowExams.length}
            </div>
          </CardContent>
        </Card>
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.stats?.thisWeek || "This Week"}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {thisWeekExams.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {upcomingExams.length === 0 ? (
        <Card className="max-md:bg-muted max-md:border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              {d?.empty?.title || "No Upcoming Exams"}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {d?.empty?.description ||
                "There are no exams scheduled in the near future."}
            </p>
            {!["STUDENT", "GUARDIAN"].includes(role || "") && (
              <Button asChild className="max-md:h-10 max-md:rounded-full">
                <Link href={`/${lang}/exams/new`}>
                  {d?.actions?.scheduleExam || "Schedule an Exam"}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ViewToggle
          exams={upcomingExams.map(
            (e): CalendarExam => ({
              id: e.id,
              title: e.title,
              examDate: e.examDate.toISOString(),
              startTime: e.startTime,
              endTime: e.endTime,
              duration: e.duration,
              examType: e.examType,
              className: e.className,
              name: e.name,
              totalMarks: e.totalMarks,
            })
          )}
          listView={
            <div className="space-y-8">
              <ExamSection
                title={d?.sections?.today || "Today's Exams"}
                exams={todayExams}
                icon={CircleAlert}
                urgent
              />
              <ExamSection
                title={d?.sections?.tomorrow || "Tomorrow"}
                exams={tomorrowExams}
                icon={Clock}
              />
              <ExamSection
                title={d?.sections?.thisWeek || "This Week"}
                exams={thisWeekExams}
                icon={Calendar}
              />
              <ExamSection
                title={d?.sections?.later || "Coming Up"}
                exams={laterExams}
                icon={BookOpen}
              />
            </div>
          }
        />
      )}
    </div>
  )
}
