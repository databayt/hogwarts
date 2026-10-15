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

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function AnalysisContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const t = dictionary.schoolConsole.analysis
  const num = (v: number, opts?: Intl.NumberFormatOptions) =>
    formatNumber(v, lang, opts)

  // Fetch analytics data
  let totalStudents = 0
  let totalTeachers = 0
  let totalClasses = 0
  let totalSubjects = 0
  let attendanceRate = 0
  let passRate = 0

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

      // Mock metrics for now
      attendanceRate = 94.5
      passRate = 87.2
    } catch (error) {
      console.error("Error fetching analysis data:", error)
    }
  }

  const studentTeacherRatio =
    totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0
  // Percent figures arrive as 0-100; Intl's percent style expects a fraction.
  const pct = (v: number) =>
    num(v / 100, { style: "percent", maximumFractionDigits: 1 })

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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold text-green-600">
                {pct(passRate)}
              </div>
              <p className="text-muted-foreground text-sm">{t.passRate}</p>
            </div>
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
      <div className="grid gap-4 md:grid-cols-3">
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

        <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pct(passRate)}</p>
                <p className="text-muted-foreground text-sm">
                  {t.academicSuccess}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
