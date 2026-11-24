// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Activity,
  BarChart3,
  Calendar,
  GraduationCap,
  PieChart,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { formatNumber } from "@/components/school-dashboard/finance/lib/format-money"

import { classAttendanceRate } from "../readiness/attendance"
import {
  loadClassReportCards,
  pickDate,
  schoolToday,
  type ClassReportCardData,
} from "../readiness/report-data"
import { ClassReport, type ClassReportStrings } from "./class-report"

interface Props {
  dictionary: Dictionary
  lang: Locale
  /** `?date=YYYY-MM-DD` for the class report; defaults to today (school time). */
  date?: string
}

export default async function AnalysisContent({
  dictionary,
  lang,
  date,
}: Props) {
  const { schoolId } = await getTenantContext()
  const t = dictionary.schoolConsole.analysis
  const num = (v: number, opts?: Intl.NumberFormatOptions) =>
    formatNumber(v, lang, opts)

  // Fetch analytics data
  let totalStudents = 0
  let totalTeachers = 0
  let totalClasses = 0
  let totalSubjects = 0
  // null = no class held in the window: shown as a dash, never a made-up rate.
  let attendanceRate: number | null = null
  let reportDate = date ?? ""
  let reportCards: ClassReportCardData[] = []

  if (schoolId) {
    try {
      const [students, teachers, classes, subjects] = await Promise.all([
        db.student.count({ where: { schoolId } }).catch(() => 0),
        db.teacher.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        db.subjectSelection
          .count({ where: { schoolId, isActive: true } })
          .catch(() => 0),
      ])

      totalStudents = students
      totalTeachers = teachers
      totalClasses = classes
      totalSubjects = subjects

      // Real 14-day class attendance (seats joined / seats expected).
      const [attendance, today] = await Promise.all([
        classAttendanceRate(schoolId, 14),
        schoolToday(schoolId),
      ])
      attendanceRate = attendance.rate
      reportDate = pickDate(date, today.today)
      reportCards = await loadClassReportCards(schoolId, reportDate)
    } catch (error) {
      console.error("Error fetching analysis data:", error)
    }
  }

  const studentTeacherRatio =
    totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0
  // Percent figures arrive as 0-100; Intl's percent style expects a fraction.
  const pct = (v: number | null) =>
    v === null ? "—" : num(v / 100, { style: "percent", maximumFractionDigits: 1 })

  const rd = dictionary.school.dashboard.readiness as Record<string, string>
  const reportStrings: ClassReportStrings = {
    title: rd.classReportTitle,
    description: rd.classReportDesc,
    date: rd.date,
    copyCard: rd.copyCard,
    copyAll: rd.copyAll,
    copied: rd.copied,
    supervisor: rd.supervisor,
    noSupervisor: rd.noSupervisor,
    canCover: rd.canCover,
    cannotCover: rd.cannotCover,
    teachers: rd.teachers,
    students: rd.students,
    noClasses: rd.noClasses,
    noTeacher: rd.noTeacher,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.totalStudents}
            </CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(totalStudents)}</div>
            <p className="text-muted-foreground text-xs">
              {t.enrolledStudents}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.totalTeachers}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(totalTeachers)}</div>
            <p className="text-muted-foreground text-xs">{t.activeFaculty}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.studentTeacher}
            </CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" dir="ltr">
              {num(studentTeacherRatio)}:1
            </div>
            <p className="text-muted-foreground text-xs">{t.ratio}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.attendanceRate}
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct(attendanceRate)}</div>
            <p className="text-muted-foreground text-xs">{t.averageThisTerm}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's class readiness, section by section */}
      {schoolId && (
        <ClassReport
          cards={reportCards}
          date={reportDate}
          lang={lang}
          strings={reportStrings}
        />
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary h-5 w-5" />
              <div>
                <CardTitle>{t.enrollmentTrends}</CardTitle>
                <CardDescription>{t.enrollmentOverTime}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <BarChart3 className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  {t.chartComingSoon}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="text-primary h-5 w-5" />
              <div>
                <CardTitle>{t.gradeDistribution}</CardTitle>
                <CardDescription>{t.studentsByLevel}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <PieChart className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  Chart coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="text-primary h-5 w-5" />
            <div>
              <CardTitle>{t.academicPerformance}</CardTitle>
              <CardDescription>{t.academicPerformanceDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* No pass-rate tile: nothing real feeds it yet, and a made-up
                87% is worse than no tile. */}
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{num(totalSubjects)}</div>
              <p className="text-muted-foreground text-sm">
                {t.subjectsOffered}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{num(totalClasses)}</div>
              <p className="text-muted-foreground text-sm">{t.activeClasses}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">-</div>
              <p className="text-muted-foreground text-sm">{t.avgGpa}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {num(totalStudents + totalTeachers)}
                </p>
                <p className="text-muted-foreground text-sm">{t.totalPeople}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pct(attendanceRate)}</p>
                <p className="text-muted-foreground text-sm">
                  {t.attendanceGoalMet}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
