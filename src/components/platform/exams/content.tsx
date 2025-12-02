import type { Locale } from "@/components/internationalization/config";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Target,
  Zap
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";
import { ExamCardFlip } from "./exam-card-flip";

interface Props {
  dictionary: Dictionary;
  lang: Locale;
}

export default async function ExamsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext();

  // Get comprehensive stats from all blocks
  let examsCount = 0;
  let questionBankCount = 0;
  let templatesCount = 0;
  let pendingMarkingCount = 0;
  let upcomingExamsCount = 0;
  let completedExamsCount = 0;
  let resultsGeneratedCount = 0;
  let studentsEnrolledCount = 0;
  let lastMonthExamsCount = 0;
  let lastMonthQuestionsCount = 0;
  let nextExam: {
    id: string;
    title: string;
    examDate: Date;
    duration: number;
    subject: { subjectName: string };
    class: { name: string };
  } | null = null;

  if (schoolId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    [
      examsCount,
      questionBankCount,
      templatesCount,
      pendingMarkingCount,
      upcomingExamsCount,
      completedExamsCount,
      resultsGeneratedCount,
      studentsEnrolledCount,
      lastMonthExamsCount,
      lastMonthQuestionsCount,
    ] = await Promise.all([
      db.exam.count({ where: { schoolId } }),
      db.questionBank.count({ where: { schoolId } }),
      db.examTemplate.count({ where: { schoolId } }),
      db.exam.count({
        where: {
          schoolId,
          status: "IN_PROGRESS",
          examDate: { lt: today }
        }
      }),
      db.exam.count({
        where: {
          schoolId,
          status: { in: ["PLANNED", "IN_PROGRESS"] },
          examDate: { gte: today }
        }
      }),
      db.exam.count({
        where: {
          schoolId,
          status: "COMPLETED"
        }
      }),
      db.examResult.count({ where: { schoolId } }),
      db.student.count({ where: { schoolId } }),
      db.exam.count({
        where: {
          schoolId,
          createdAt: { lt: lastMonth }
        }
      }),
      db.questionBank.count({
        where: {
          schoolId,
          createdAt: { lt: lastMonth }
        }
      }),
    ]);

    // Fetch next upcoming exam separately for proper type inference
    nextExam = await db.exam.findFirst({
      where: {
        schoolId,
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        examDate: { gte: today }
      },
      orderBy: { examDate: "asc" },
      select: {
        id: true,
        title: true,
        examDate: true,
        duration: true,
        subject: { select: { subjectName: true } },
        class: { select: { name: true } },
      }
    });
  }

  // Format next exam details for the card
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const d = dictionary?.school?.exams;

  // Calculate changes
  const examChange = lastMonthExamsCount > 0
    ? ((examsCount - lastMonthExamsCount) / lastMonthExamsCount * 100).toFixed(1)
    : examsCount > 0 ? "+100" : "0";
  const questionChange = lastMonthQuestionsCount > 0
    ? ((questionBankCount - lastMonthQuestionsCount) / lastMonthQuestionsCount * 100).toFixed(1)
    : questionBankCount > 0 ? "+100" : "0";

  // Calculate completion rate
  const completionRate = examsCount > 0
    ? Math.round((completedExamsCount / examsCount) * 100)
    : 0;

  // Calculate marking progress
  const totalToMark = pendingMarkingCount + completedExamsCount;
  const markingProgress = totalToMark > 0
    ? Math.round((completedExamsCount / totalToMark) * 100)
    : 100;

  // Stats data for trending display
  const trendingStats = [
    {
      name: d?.dashboard?.stats?.totalExams || "Total Exams",
      value: examsCount.toString(),
      change: `${Number(examChange) >= 0 ? '+' : ''}${examChange}%`,
      changeType: Number(examChange) >= 0 ? "positive" : "negative",
      icon: Calendar,
    },
    {
      name: d?.dashboard?.stats?.upcoming || "Upcoming",
      value: upcomingExamsCount.toString(),
      change: upcomingExamsCount > 3 ? "Active period" : "Normal",
      changeType: upcomingExamsCount > 3 ? "positive" : "neutral",
      icon: Clock,
    },
    {
      name: d?.dashboard?.stats?.questionBank || "Question Bank",
      value: questionBankCount.toString(),
      change: `${Number(questionChange) >= 0 ? '+' : ''}${questionChange}%`,
      changeType: Number(questionChange) >= 0 ? "positive" : "negative",
      icon: BookOpen,
    },
    {
      name: d?.dashboard?.stats?.students || "Students",
      value: studentsEnrolledCount.toString(),
      change: "Enrolled",
      changeType: "neutral",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section: Card Flip + 2x2 Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Card Flip - Next Exam */}
        <ExamCardFlip
          title={nextExam ? (d?.upcomingExams || "Next Exam") : (d?.noUpcomingExams || "No Upcoming")}
          subtitle={nextExam?.title || (d?.createExam || "Schedule an exam")}
          description={nextExam
            ? `${nextExam.subject?.subjectName || ""} - ${nextExam.class?.name || ""}`
            : (d?.createDescription || "Create a new examination")
          }
          examDetails={nextExam ? [
            { label: d?.examDate || "Date", value: formatDate(nextExam.examDate) },
            { label: d?.time || "Time", value: formatTime(nextExam.examDate) },
            { label: d?.duration || "Duration", value: `${nextExam.duration} ${d?.minutes || "min"}` },
            { label: d?.dashboard?.stats?.questionBank || "Qbank", value: `${questionBankCount}`, href: `/${lang}/exams/qbank` },
          ] : [
            { label: d?.dashboard?.stats?.totalExams || "Total", value: `${examsCount}` },
            { label: d?.dashboard?.stats?.upcoming || "Upcoming", value: `${upcomingExamsCount}` },
            { label: d?.dashboard?.stats?.questionBank || "Qbank", value: `${questionBankCount}`, href: `/${lang}/exams/qbank` },
            { label: d?.dashboard?.stats?.templates || "Templates", value: `${templatesCount}` },
          ]}
          ctaHref={nextExam ? `/${lang}/exams/${nextExam.id}` : `/${lang}/exams/new`}
          ctaText={nextExam ? (d?.viewDetails || "View Details") : (d?.createExam || "Create Exam")}
        />

        {/* 2x2 Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Exams */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/10" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">{d?.dashboard?.stats?.totalExams || "Total Exams"}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{examsCount}</span>
                <span className={cn(
                  "text-xs font-medium",
                  Number(examChange) >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {Number(examChange) >= 0 && <TrendingUp className="inline h-3 w-3 mr-0.5" />}
                  {Number(examChange) < 0 && <TrendingDown className="inline h-3 w-3 mr-0.5" />}
                  {examChange}%
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d?.dashboard?.stats?.allScheduledExams || "All scheduled exams"}</p>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-blue-500/10" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{d?.dashboard?.stats?.upcoming || "Upcoming"}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{upcomingExamsCount}</span>
                {upcomingExamsCount > 3 && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d?.dashboard?.stats?.scheduledForFuture || "Scheduled for future"}</p>
            </CardContent>
          </Card>

          {/* Question Bank */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-purple-500/10" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">{d?.dashboard?.stats?.questionBank || "Question Bank"}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{questionBankCount}</span>
                <span className={cn(
                  "text-xs font-medium",
                  Number(questionChange) >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {Number(questionChange) >= 0 && <TrendingUp className="inline h-3 w-3 mr-0.5" />}
                  {Number(questionChange) < 0 && <TrendingDown className="inline h-3 w-3 mr-0.5" />}
                  {questionChange}%
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d?.dashboard?.stats?.availableQuestions || "Available questions"}</p>
            </CardContent>
          </Card>

          {/* Students */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-emerald-500/10" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">{d?.dashboard?.stats?.students || "Students"}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{studentsEnrolledCount}</span>
                <Badge variant="outline" className="text-xs">Enrolled</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d?.dashboard?.stats?.enrolledStudents || "Enrolled students"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Cards Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {d?.dashboard?.stats?.completed || "Completed"}
              </p>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-semibold text-foreground mt-1">{completedExamsCount}</p>
            <Progress value={completionRate} className="mt-4 h-2" />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-primary font-medium">{completionRate}%</span>
              <span className="text-muted-foreground">
                {completedExamsCount} of {examsCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {d?.dashboard?.stats?.pendingMarking || "Pending Marking"}
              </p>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-semibold text-foreground mt-1">{pendingMarkingCount}</p>
            <Progress value={markingProgress} className="mt-4 h-2" />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-primary font-medium">{markingProgress}% graded</span>
              <span className="text-muted-foreground">
                {d?.dashboard?.stats?.awaitingGrading || "awaiting"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {d?.dashboard?.stats?.resultsGenerated || "Results Generated"}
              </p>
              <FileBarChart className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-foreground mt-1">{resultsGeneratedCount}</p>
            <Progress
              value={studentsEnrolledCount > 0 ? (resultsGeneratedCount / studentsEnrolledCount) * 100 : 0}
              className="mt-4 h-2"
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-primary font-medium">
                {studentsEnrolledCount > 0 ? Math.round((resultsGeneratedCount / studentsEnrolledCount) * 100) : 0}%
              </span>
              <span className="text-muted-foreground">
                {d?.dashboard?.stats?.studentResults || "student results"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {d?.dashboard?.stats?.templates || "Templates"}
              </p>
              <Target className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-semibold text-foreground mt-1">{templatesCount}</p>
            <div className="mt-4 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">Reusable</Badge>
              <Badge variant="outline" className="text-xs">Auto-generate</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {d?.dashboard?.stats?.examTemplates || "exam templates"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Blocks - Professional Card Design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Question Bank Block */}
        <Card className="group relative overflow-hidden border-border/50 hover:border-blue-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {questionBankCount} {d?.qbank?.question || "questions"}
              </Badge>
            </div>
            <CardTitle className="mt-4">{d?.dashboard?.blocks?.qbank?.title || "Question Bank"}</CardTitle>
            <CardDescription>
              {d?.dashboard?.blocks?.qbank?.description || "Build and manage your repository of questions"}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-sm text-muted-foreground">
              {d?.dashboard?.blocks?.qbank?.details || "Store questions with metadata, difficulty levels, Bloom taxonomy, and topic tags for reuse."}
            </p>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href={`/${lang}/exams/qbank`}>
                  {d?.dashboard?.blocks?.qbank?.browse || "Browse"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="icon">
                <Link href={`/${lang}/exams/qbank/new`}>
                  <span className="sr-only">{d?.dashboard?.blocks?.qbank?.add || "Add"}</span>
                  +
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auto Generate Block */}
        <Card className="group relative overflow-hidden border-border/50 hover:border-purple-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
            <CardTitle className="mt-4">{d?.dashboard?.blocks?.generate?.title || "Auto Generation"}</CardTitle>
            <CardDescription>
              {d?.dashboard?.blocks?.generate?.description || "AI-powered exam and question generation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-sm text-muted-foreground">
              {d?.dashboard?.blocks?.generate?.details || "Generate exams from templates or let AI create questions based on curriculum and difficulty."}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="secondary" className="flex-1">
                <Link href={`/${lang}/exams/generate`}>
                  {d?.dashboard?.blocks?.generate?.dashboard || "Generate"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${lang}/exams/generate/templates`}>
                  {d?.dashboard?.blocks?.generate?.templates || "Templates"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auto Marking Block */}
        <Card className="group relative overflow-hidden border-border/50 hover:border-orange-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-orange-500/10 ring-1 ring-orange-500/20">
                <ClipboardCheck className="h-5 w-5 text-orange-500" />
              </div>
              {pendingMarkingCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingMarkingCount} pending
                </Badge>
              )}
            </div>
            <CardTitle className="mt-4">{d?.dashboard?.blocks?.mark?.title || "Auto Marking"}</CardTitle>
            <CardDescription>
              {d?.dashboard?.blocks?.mark?.description || "Automated grading with AI assistance"}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-sm text-muted-foreground">
              {d?.dashboard?.blocks?.mark?.details || "Grade MCQs automatically, use rubrics for essays, and leverage AI for subjective answers."}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="secondary" className="flex-1">
                <Link href={`/${lang}/exams/mark`}>
                  {d?.dashboard?.blocks?.mark?.dashboard || "Mark"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${lang}/exams/mark/pending`}>
                  Pending ({pendingMarkingCount})
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results & Quick Actions Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Results Block */}
        <Card className="group relative overflow-hidden border-border/50 hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <FileBarChart className="h-5 w-5 text-emerald-500" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {resultsGeneratedCount} records
              </Badge>
            </div>
            <CardTitle className="mt-4">{d?.dashboard?.blocks?.results?.title || "Results & Reports"}</CardTitle>
            <CardDescription>
              {d?.dashboard?.blocks?.results?.description || "Generate comprehensive result reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-sm text-muted-foreground">
              {d?.dashboard?.blocks?.results?.details || "Calculate grades, generate PDF reports, analyze performance, and export results."}
            </p>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-lg font-semibold">{completionRate}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground">Avg. Score</p>
                <p className="text-lg font-semibold">--</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1">
                <Link href={`/${lang}/exams/result`}>
                  {d?.dashboard?.blocks?.results?.view || "View Results"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${lang}/exams/result/analytics`}>
                  {d?.dashboard?.blocks?.results?.analytics || "Analytics"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted ring-1 ring-border/50">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{d?.dashboard?.quickActions?.title || "Quick Actions"}</CardTitle>
                <CardDescription>
                  {d?.dashboard?.quickActions?.description || "Common tasks and shortcuts"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start h-11" asChild>
              <Link href={`/${lang}/exams/new`}>
                <Calendar className="mr-3 h-4 w-4 text-primary" />
                {d?.createExam || "Create New Exam"}
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-11" asChild>
              <Link href={`/${lang}/exams/qbank/new`}>
                <BookOpen className="mr-3 h-4 w-4 text-blue-500" />
                {d?.qbank?.addQuestion || "Add Question to Bank"}
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-11" asChild>
              <Link href={`/${lang}/exams/mark/pending`}>
                <ClipboardCheck className="mr-3 h-4 w-4 text-orange-500" />
                {d?.dashboard?.quickActions?.gradePending || "Grade Pending Exams"}
                {pendingMarkingCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {pendingMarkingCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-11" asChild>
              <Link href={`/${lang}/exams/generate`}>
                <Sparkles className="mr-3 h-4 w-4 text-purple-500" />
                {d?.dashboard?.quickActions?.generateAI || "Generate with AI"}
              </Link>
            </Button>
            <Separator className="my-3" />
            <Button variant="ghost" className="w-full justify-start h-11" asChild>
              <Link href={`/${lang}/exams/result/recent`}>
                <FileBarChart className="mr-3 h-4 w-4 text-emerald-500" />
                {d?.dashboard?.quickActions?.recentResults || "View Recent Results"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Guide - Compact */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">{d?.dashboard?.workflow?.title || "Exam Workflow Guide"}</CardTitle>
          <CardDescription>
            {d?.dashboard?.workflow?.description || "Follow these steps for a complete exam lifecycle"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { step: 1, title: d?.dashboard?.workflow?.step1?.title || "Build Question Bank", icon: BookOpen, color: "text-blue-500" },
              { step: 2, title: d?.dashboard?.workflow?.step2?.title || "Create Exam", icon: Calendar, color: "text-primary" },
              { step: 3, title: d?.dashboard?.workflow?.step3?.title || "Conduct Exam", icon: Users, color: "text-purple-500" },
              { step: 4, title: d?.dashboard?.workflow?.step4?.title || "Grade & Mark", icon: ClipboardCheck, color: "text-orange-500" },
              { step: 5, title: d?.dashboard?.workflow?.step5?.title || "Generate Results", icon: FileBarChart, color: "text-emerald-500" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {item.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("h-4 w-4 shrink-0", item.color)} />
                    <p className="text-sm font-medium truncate">{item.title}</p>
                  </div>
                </div>
                {index < 4 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
