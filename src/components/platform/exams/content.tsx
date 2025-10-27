import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import type { Locale } from "@/components/internationalization/config";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  FileBarChart,
  BookMarked,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";

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

  if (schoolId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    [
      examsCount,
      questionBankCount,
      templatesCount,
      pendingMarkingCount,
      upcomingExamsCount,
      completedExamsCount,
      resultsGeneratedCount,
      studentsEnrolledCount,
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
    ]);
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={dictionary?.school?.exams?.title || "Examination Management"}
          description={
            dictionary?.school?.exams?.description ||
            "Comprehensive exam management system with question banks, auto-generation, marking, and results"
          }
          className="text-start max-w-none"
        />

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{examsCount}</div>
              <p className="text-xs text-muted-foreground">
                All scheduled exams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingExamsCount}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for future
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Question Bank</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionBankCount}</div>
              <p className="text-xs text-muted-foreground">
                Available questions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentsEnrolledCount}</div>
              <p className="text-xs text-muted-foreground">
                Enrolled students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedExamsCount}</div>
              <p className="text-xs text-muted-foreground">
                Exams finished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Marking</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingMarkingCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting grading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Results Generated</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resultsGeneratedCount}</div>
              <p className="text-xs text-muted-foreground">
                Student results
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templatesCount}</div>
              <p className="text-xs text-muted-foreground">
                Exam templates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Blocks Navigation */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Manage Block */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Exam Management
              </CardTitle>
              <CardDescription>
                Schedule, organize, and oversee all examinations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create exams, set schedules, define marks, and manage exam lifecycle from draft to completion.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href={`/${lang}/exams`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    View All Exams
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/exams/new`}>
                    Create New Exam
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question Bank Block */}
          <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Question Bank
              </CardTitle>
              <CardDescription>
                Build and manage your repository of questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Store questions with metadata, difficulty levels, Bloom taxonomy, and topic tags for reuse.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/generate/questions`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Questions
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/generate/questions/new`}>
                    Add Question
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Auto Generate Block */}
          <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Auto Generation
              </CardTitle>
              <CardDescription>
                AI-powered exam and question generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Generate exams from templates or let AI create questions based on curriculum and difficulty.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/generate`}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/generate/templates`}>
                    Exam Templates
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Auto Marking Block */}
          <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-orange-500" />
                Auto Marking
              </CardTitle>
              <CardDescription>
                Automated grading with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Grade MCQs automatically, use rubrics for essays, and leverage AI for subjective answers.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/mark`}>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Marking Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/mark/pending`}>
                    Pending ({pendingMarkingCount})
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Block */}
          <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-green-500" />
                Results & Reports
              </CardTitle>
              <CardDescription>
                Generate comprehensive result reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Calculate grades, generate PDF reports, analyze performance, and export results.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/results`}>
                    <FileBarChart className="mr-2 h-4 w-4" />
                    View Results
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/results/analytics`}>
                    Analytics
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-slate-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href={`/${lang}/exams/upcoming`}>
                  View Upcoming Exams
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href={`/${lang}/mark/pending`}>
                  Grade Pending Exams
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href={`/${lang}/results/recent`}>
                  Recent Results
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href={`/${lang}/generate/questions/ai-generate`}>
                  Generate Questions with AI
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Workflow Guide</CardTitle>
            <CardDescription>
              Follow these steps for a complete exam lifecycle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Build Question Bank</h3>
                  <p className="text-sm text-muted-foreground">
                    Add questions manually or use AI generation. Tag with topics, difficulty, and Bloom levels.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Create Exam</h3>
                  <p className="text-sm text-muted-foreground">
                    Use templates or generate from question bank. Set schedule, duration, and marks distribution.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Conduct Exam</h3>
                  <p className="text-sm text-muted-foreground">
                    Publish exam to students. Monitor progress and attendance during exam period.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div>
                  <h3 className="font-medium">Grade & Mark</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto-grade MCQs, use rubrics for essays, and AI assistance for subjective answers.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  5
                </div>
                <div>
                  <h3 className="font-medium">Generate Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Calculate final marks, assign grades, generate PDF reports, and analyze performance metrics.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
