"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  BookOpen,
  Award,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Printer,
  Pencil,
  Trash2,
  Calendar,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { ResultCreateForm } from "@/components/platform/grades/form";
import { deleteResult } from "@/components/platform/grades/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type {
  getResultDetail,
  getStudentGradeHistory,
  getClassGradeStats,
} from "./queries";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

// Types
type GradeDetail = NonNullable<Awaited<ReturnType<typeof getResultDetail>>>;
type GradeHistory = Awaited<ReturnType<typeof getStudentGradeHistory>>;
type ClassStats = Awaited<ReturnType<typeof getClassGradeStats>>;

interface GradeDetailContentProps {
  grade: GradeDetail;
  history: GradeHistory;
  classStats: ClassStats;
  studentRank: { rank: number; percentile: number; totalStudents: number };
  dictionary: Dictionary;
  lang: Locale;
}

// Grade badge color helper
function getGradeVariant(
  grade: string
): "default" | "secondary" | "destructive" | "outline" {
  if (grade.startsWith("A")) return "default";
  if (grade.startsWith("B")) return "secondary";
  if (grade.startsWith("C")) return "outline";
  return "destructive";
}

// Trend icon helper
function TrendIcon({ trend }: { trend: "improving" | "declining" | "stable" }) {
  if (trend === "improving")
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "declining")
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
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
};

export function GradeDetailContent({
  grade,
  history,
  classStats,
  studentRank,
  dictionary,
  lang,
}: GradeDetailContentProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const t = dictionary.school.grades;

  // Format student name
  const studentName = grade.student
    ? `${grade.student.givenName} ${grade.student.surname}`
    : "Unknown";

  // Get initials for avatar
  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Get assignment/exam title
  const itemTitle =
    grade.assignment?.title || grade.exam?.title || grade.title || "Grade";
  const itemType = grade.assignment ? "assignment" : grade.exam ? "exam" : "grade";

  // Is passing
  const isPassing = grade.percentage >= 50;

  // Above/below average
  const isAboveAverage = grade.percentage > classStats.classAverage;

  // Grade history chart data
  const historyChartData = useMemo(() => {
    return history.results.map((r, index) => ({
      name: `${index + 1}`,
      percentage: r.percentage,
      grade: r.grade,
    }));
  }, [history.results]);

  // Grade distribution chart data
  const distributionChartData = useMemo(() => {
    const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
    return grades
      .filter((g) => classStats.gradeDistribution[g])
      .map((g) => ({
        grade: g,
        count: classStats.gradeDistribution[g] || 0,
        isCurrentGrade: g === grade.grade,
      }));
  }, [classStats.gradeDistribution, grade.grade]);

  // Handle delete
  const handleDelete = async () => {
    try {
      const ok = await confirmDeleteDialog(
        t.deleteResultConfirm.replace("{studentName}", studentName)
      );
      if (!ok) return;

      await deleteResult({ id: grade.id });
      DeleteToast();
      router.push(`/${lang}/grades`);
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : t.failedToUpdate);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Format date
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/grades`}>
                <ArrowLeft className="h-4 w-4 me-2" />
                {t.backToGrades}
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 me-2" />
              {t.printGrade}
            </Button>
            <Button variant="outline" size="sm" onClick={() => openModal(grade.id)}>
              <Pencil className="h-4 w-4 me-2" />
              {t.editGrade}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 me-2" />
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
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-lg">{studentName}</p>
                  {grade.student?.studentId && (
                    <p className="text-sm text-muted-foreground">
                      {t.studentId}: {grade.student.studentId}
                    </p>
                  )}
                  {grade.class && (
                    <p className="text-sm text-muted-foreground">
                      {t.class}: {grade.class.name}
                    </p>
                  )}
                  {grade.student?.email && (
                    <p className="text-sm text-muted-foreground">
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
                    {itemType}
                  </Badge>
                </div>
                {grade.subject && (
                  <p className="text-sm text-muted-foreground">
                    {t.subject}: {grade.subject.subjectName}
                  </p>
                )}
                {(grade.assignment?.dueDate || grade.exam?.examDate) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {t.dueDate}:{" "}
                    {formatDate(grade.assignment?.dueDate || grade.exam?.examDate)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t.totalPoints}:{" "}
                  {Number(grade.assignment?.totalPoints || grade.exam?.totalMarks || grade.maxScore)}
                </p>
                {(grade.assignment?.description || grade.exam?.description || grade.description) && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {grade.assignment?.description || grade.exam?.description || grade.description}
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
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                  <p className="text-4xl font-bold">
                    {Number(grade.score)}/{Number(grade.maxScore)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.score}</p>
                </div>

                {/* Percentage with Progress */}
                <div className="flex flex-col justify-center gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{grade.percentage.toFixed(0)}%</p>
                    <Badge variant={isPassing ? "default" : "destructive"}>
                      {isPassing ? t.passStatus : t.failStatus}
                    </Badge>
                  </div>
                  <Progress value={grade.percentage} className="h-2" />
                  <p className="text-sm text-muted-foreground">{t.percentage}</p>
                </div>

                {/* Grade Badge */}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                  <Badge
                    variant={getGradeVariant(grade.grade)}
                    className="text-2xl px-4 py-2"
                  >
                    {grade.grade}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">{t.grade}</p>
                </div>

                {/* Class Comparison */}
                <div className="flex flex-col justify-center gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">
                      {classStats.classAverage.toFixed(1)}%
                    </p>
                    <Badge variant={isAboveAverage ? "default" : "secondary"}>
                      {isAboveAverage ? t.aboveAverage : t.belowAverage}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.classAverage}</p>
                  {studentRank.rank > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t.rank} #{studentRank.rank} {t.outOf} {studentRank.totalStudents} ({t.percentile}: {studentRank.percentile}%)
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
                  <p className="text-sm whitespace-pre-wrap">{grade.feedback}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t.noFeedback}
                  </p>
                )}
                <Separator />
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {grade.gradedBy && (
                    <p>
                      {t.gradedBy}: {grade.gradedBy}
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
                  <p className="text-sm text-muted-foreground">
                    {t.average}: {history.average.toFixed(1)}%
                  </p>
                </div>

                {/* Mini bar chart */}
                {historyChartData.length > 1 ? (
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={historyChartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, t.percentage]}
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
                  <p className="text-sm text-muted-foreground text-center py-8">
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
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-semibold text-green-600">
                        {classStats.highestScore.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">{t.highestScore}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-semibold text-red-600">
                        {classStats.lowestScore.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">{t.lowestScore}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-semibold">
                      {classStats.totalStudents} {t.studentsInClass}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">{t.yourScore}:</span>
                      <Badge variant={getGradeVariant(grade.grade)}>{grade.grade}</Badge>
                      <span className="text-sm">({grade.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>

                {/* Distribution chart */}
                <div className="h-[150px]">
                  {distributionChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionChartData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="grade" type="category" tick={{ fontSize: 10 }} width={30} />
                        <Tooltip
                          formatter={(value: number) => [value, t.studentsInClass?.split(" ")[0] || "Students"]}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {distributionChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isCurrentGrade ? "#3b82f6" : "#94a3b8"}
                              stroke={entry.isCurrentGrade ? "#1d4ed8" : "none"}
                              strokeWidth={entry.isCurrentGrade ? 2 : 0}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t.gradeDistribution}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        content={
          <ResultCreateForm
            dictionary={t}
            onSuccess={() => router.refresh()}
          />
        }
      />
    </>
  );
}
