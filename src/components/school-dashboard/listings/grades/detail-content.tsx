"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquare,
  Minus,
  Pencil,
  Printer,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { displayName, initialsOf } from "@/lib/name-utils"
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Ltr } from "@/components/atom/ltr"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { useNameDisplay } from "@/components/school-dashboard/context/use-name-display"
import { deleteResult } from "@/components/school-dashboard/listings/grades/actions"

import { generateGradeCertificate } from "./certificate/actions"
import type {
  getClassGradeStats,
  getResultDetail,
  getStudentGradeHistory,
} from "./queries"

// Types
type GradeDetail = NonNullable<Awaited<ReturnType<typeof getResultDetail>>>
type GradeHistory = Awaited<ReturnType<typeof getStudentGradeHistory>>
type ClassStats = Awaited<ReturnType<typeof getClassGradeStats>>

interface GradeDetailContentProps {
  grade: GradeDetail
  history: GradeHistory
  classStats: ClassStats
  studentRank: { rank: number; percentile: number; totalStudents: number }
  /** The grader's display name, resolved server-side from `gradedBy`. */
  gradedByName?: string | null
  dictionary?: Dictionary
  lang: Locale
}

// Grade badge color helper
function getGradeVariant(
  grade: string
): "default" | "secondary" | "destructive" | "outline" {
  if (grade.startsWith("A")) return "default"
  if (grade.startsWith("B")) return "secondary"
  if (grade.startsWith("C")) return "outline"
  return "destructive"
}

// Trend icon helper
function TrendIcon({ trend }: { trend: "improving" | "declining" | "stable" }) {
  if (trend === "improving")
    return <TrendingUp className="h-4 w-4 text-green-500" />
  if (trend === "declining")
    return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="text-muted-foreground h-4 w-4" />
}

// Chart colors by grade
const GRADE_COLORS: Record<string, string> = {
  "A+": "#22c55e",
  A: "#22c55e",
  "A-": "#22c55e",
  "B+": "#3b82f6",
  B: "#3b82f6",
  "B-": "#3b82f6",
  "C+": "#f59e0b",
  C: "#f59e0b",
  "C-": "#f59e0b",
  "D+": "#ef4444",
  D: "#ef4444",
  "D-": "#ef4444",
  F: "#dc2626",
}

export function GradeDetailContent({
  grade,
  history,
  classStats,
  studentRank,
  gradedByName,
  dictionary: dictionaryProp,
  lang,
}: GradeDetailContentProps) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const router = useRouter()
  const nameDisplay = useNameDisplay()
  const t = dictionary.school.grades
  const [isDownloading, setIsDownloading] = useState<
    "certificate" | "print" | null
  >(null)

  // Format student name
  const studentName = grade.student
    ? displayName(grade.student, nameDisplay)
    : t.unknown

  // Get initials for avatar
  const initials = initialsOf(studentName)

  // Get assignment/exam title
  const itemTitle =
    grade.assignment?.title || grade.exam?.title || grade.title || t.grade
  const itemType = grade.assignment
    ? "assignment"
    : grade.exam
      ? "exam"
      : "grade"

  // Is passing
  const isPassing = grade.percentage >= 50

  // Above / at / below the class average. A lone student (or a tie) IS the
  // average — calling a 100% "below average" next to a 100% average was wrong.
  const hasPeers = classStats.totalStudents > 1
  const averageDelta = grade.percentage - classStats.classAverage
  const averageStanding =
    Math.abs(averageDelta) < 0.05 ? "at" : averageDelta > 0 ? "above" : "below"
  const isRtl = lang === "ar"

  // Grade history chart data
  const historyChartData = useMemo(() => {
    return history.results.map((r, index) => ({
      name: `${index + 1}`,
      percentage: r.percentage,
      grade: r.grade,
    }))
  }, [history.results])

  // Grade distribution chart data
  const distributionChartData = useMemo(() => {
    const grades = [
      "A+",
      "A",
      "A-",
      "B+",
      "B",
      "B-",
      "C+",
      "C",
      "C-",
      "D+",
      "D",
      "D-",
      "F",
    ]
    return grades
      .filter((g) => classStats.gradeDistribution[g])
      .map((g) => ({
        grade: g,
        count: classStats.gradeDistribution[g] || 0,
        isCurrentGrade: g === grade.grade,
      }))
  }, [classStats.gradeDistribution, grade.grade])

  // Handle delete
  const handleDelete = async () => {
    try {
      const ok = await confirmDeleteDialog(
        t.deleteResultConfirm.replace("{studentName}", studentName)
      )
      if (!ok) return

      await deleteResult({ id: grade.id })
      DeleteToast()
      router.push(`/${lang}/grades/book`)
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : t.failedToUpdate)
    }
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Handle certificate download
  const handleDownload = async (type: "certificate" | "print") => {
    try {
      setIsDownloading(type)
      const result = await generateGradeCertificate({
        gradeId: grade.id,
        type,
        language: lang,
        includeSignatures: true,
        includeFeedback: true,
      })

      if (result.success && result.pdfUrl && result.fileName) {
        // Create download link
        const link = document.createElement("a")
        link.href = result.pdfUrl
        link.download = result.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        ErrorToast(
          actionErrorMessage(result.error, dictionary, t.downloadFailed)
        )
      }
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : t.downloadFailed)
    } finally {
      setIsDownloading(null)
    }
  }

  // Format date
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/grades/book`}>
                <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
                {t.backToGrades}
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* Download dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!!isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="me-2 h-4 w-4" />
                  )}
                  {t.download}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDownload("certificate")}
                  disabled={!!isDownloading}
                >
                  <Award className="me-2 h-4 w-4" />
                  {t.downloadCertificate}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownload("print")}
                  disabled={!!isDownloading}
                >
                  <FileText className="me-2 h-4 w-4" />
                  {t.downloadReport}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="me-2 h-4 w-4" />
                  {t.printGrade}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/${lang}/grades/add/${grade.id}/selection`)
              }
            >
              <Pencil className="me-2 h-4 w-4" />
              {t.editGrade}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="me-2 h-4 w-4" />
              {t.deleteGrade}
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Student Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                {t.studentInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold">
                    <bdi dir="auto">{studentName}</bdi>
                  </p>
                  {grade.student?.studentId && (
                    <p className="text-muted-foreground text-sm">
                      {t.studentId}: {grade.student.studentId}
                    </p>
                  )}
                  {grade.section && (
                    <p className="text-muted-foreground text-sm">
                      {t.class}: {grade.section.name}
                    </p>
                  )}
                  {grade.student?.email && (
                    <p className="text-muted-foreground text-sm">
                      {grade.student.email}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment/Exam Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                {itemType === "exam" ? t.examInfo : t.assignmentInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{itemTitle}</p>
                  <Badge variant="outline" className="capitalize">
                    {itemType === "assignment"
                      ? t.assignment
                      : itemType === "exam"
                        ? t.exam
                        : t.grade}
                  </Badge>
                </div>
                {grade.subject && (
                  <p className="text-muted-foreground text-sm">
                    {t.subject}: {grade.subject.name}
                  </p>
                )}
                {(grade.assignment?.dueDate || grade.exam?.examDate) && (
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    {t.dueDate}:{" "}
                    {formatDate(
                      grade.assignment?.dueDate || grade.exam?.examDate
                    )}
                  </p>
                )}
                <p className="text-muted-foreground text-sm">
                  {t.totalPoints}:{" "}
                  {Number(
                    grade.assignment?.totalPoints ||
                      grade.exam?.totalMarks ||
                      grade.maxScore
                  )}
                </p>
                {(grade.assignment?.description ||
                  grade.exam?.description ||
                  grade.description) && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {grade.assignment?.description ||
                      grade.exam?.description ||
                      grade.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Score Card - Full Width */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4" />
                {t.scoreDetails}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Score Display */}
                <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg p-4">
                  <p className="text-4xl font-bold">
                    <Ltr>
                      {Number(grade.score)}/{Number(grade.maxScore)}
                    </Ltr>
                  </p>
                  <p className="text-muted-foreground text-sm">{t.score}</p>
                </div>

                {/* Percentage with Progress */}
                <div className="flex flex-col justify-center gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">
                      <Ltr>{grade.percentage.toFixed(0)}%</Ltr>
                    </p>
                    <Badge variant={isPassing ? "default" : "destructive"}>
                      {isPassing ? t.passStatus : t.failStatus}
                    </Badge>
                  </div>
                  <Progress value={grade.percentage} className="h-2" />
                  <p className="text-muted-foreground text-sm">
                    {t.percentage}
                  </p>
                </div>

                {/* Grade Badge */}
                <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg p-4">
                  <Badge
                    variant={getGradeVariant(grade.grade)}
                    className="px-4 py-2 text-2xl"
                  >
                    <Ltr>{grade.grade}</Ltr>
                  </Badge>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {t.grade}
                  </p>
                </div>

                {/* Class Comparison */}
                <div className="flex flex-col justify-center gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">
                      <Ltr>{classStats.classAverage.toFixed(1)}%</Ltr>
                    </p>
                    {hasPeers && (
                      <Badge
                        variant={
                          averageStanding === "below" ? "secondary" : "default"
                        }
                      >
                        {averageStanding === "above"
                          ? t.aboveAverage
                          : averageStanding === "below"
                            ? t.belowAverage
                            : t.atAverage}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t.classAverage}
                  </p>
                  {studentRank.rank > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {t.rank} <Ltr>#{studentRank.rank}</Ltr> {t.outOf}{" "}
                      {studentRank.totalStudents} ({t.percentile}:{" "}
                      <Ltr>{studentRank.percentile}%</Ltr>)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                {t.feedbackSection}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {grade.feedback ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {grade.feedback}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    {t.noFeedback}
                  </p>
                )}
                <Separator />
                <div className="text-muted-foreground flex flex-col gap-1 text-xs">
                  {gradedByName && (
                    <p>
                      {t.gradedBy}: <bdi dir="auto">{gradedByName}</bdi>
                    </p>
                  )}
                  <p>
                    {t.gradedOn}: {formatDate(grade.gradedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade History Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4" />
                {t.gradeHistory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Trend indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={history.trend} />
                    <span className="text-sm font-medium capitalize">
                      {t[history.trend] || history.trend}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t.average}: <Ltr>{history.average.toFixed(1)}%</Ltr>
                  </p>
                </div>

                {/* Mini bar chart */}
                {historyChartData.length > 1 ? (
                  // dir="ltr" keeps recharts' SVG text unmirrored; the axes
                  // themselves flip for Arabic (reversed x, y on the right).
                  <div className="h-[120px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={historyChartData}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          reversed={isRtl}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 10 }}
                          width={32}
                          orientation={isRtl ? "right" : "left"}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value}%`,
                            t.percentage,
                          ]}
                          labelFormatter={(label) => `#${label}`}
                        />
                        <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                          {historyChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={GRADE_COLORS[entry.grade] || "#94a3b8"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    {t.previousGrades}: {history.results.length}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Class Comparison Card - Full Width */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                {t.classComparison}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Stats */}
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p
                        className={
                          hasPeers
                            ? "text-lg font-semibold text-green-600"
                            : "text-lg font-semibold"
                        }
                      >
                        <Ltr>{classStats.highestScore.toFixed(0)}%</Ltr>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t.highestScore}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p
                        className={
                          hasPeers
                            ? "text-lg font-semibold text-red-600"
                            : "text-lg font-semibold"
                        }
                      >
                        <Ltr>{classStats.lowestScore.toFixed(0)}%</Ltr>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t.lowestScore}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-lg font-semibold">
                      {classStats.totalStudents} {t.studentsInClass}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm">{t.yourScore}:</span>
                      <Badge variant={getGradeVariant(grade.grade)}>
                        <Ltr>{grade.grade}</Ltr>
                      </Badge>
                      <span className="text-sm">
                        (<Ltr>{grade.percentage.toFixed(0)}%</Ltr>)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Distribution chart */}
                <div className="h-[150px]" dir="ltr">
                  {distributionChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionChartData} layout="vertical">
                        {/* Counts read from the tooltip; a numeric axis over
                            one or two students only drew a stray 0–1 scale. */}
                        <XAxis
                          type="number"
                          hide
                          allowDecimals={false}
                          reversed={isRtl}
                        />
                        <YAxis
                          dataKey="grade"
                          type="category"
                          tick={{ fontSize: 10 }}
                          width={30}
                          orientation={isRtl ? "right" : "left"}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            value,
                            t.studentsInClass,
                          ]}
                        />
                        <Bar
                          dataKey="count"
                          radius={isRtl ? [4, 0, 0, 4] : [0, 4, 4, 0]}
                        >
                          {distributionChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.isCurrentGrade ? "#3b82f6" : "#94a3b8"
                              }
                              stroke={entry.isCurrentGrade ? "#1d4ed8" : "none"}
                              strokeWidth={entry.isCurrentGrade ? 2 : 0}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      {t.gradeDistribution}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
