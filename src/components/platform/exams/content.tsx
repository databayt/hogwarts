import PageHeader from "@/components/atom/page-header";
import { PageNav, type PageNavItem } from "@/components/atom/page-nav";
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

  const d = dictionary?.school?.exams?.dashboard;

  // Define exams page navigation
  const examsPages: PageNavItem[] = [
    {
      name: d?.blocks?.manage?.title || 'Manage',
      href: `/${lang}/exams`
    },
    {
      name: d?.blocks?.qbank?.title || 'QBank',
      href: `/${lang}/exams/qbank`
    },
    {
      name: d?.blocks?.generate?.title || 'Generate',
      href: `/${lang}/exams/generate`
    },
    {
      name: d?.blocks?.mark?.title || 'Mark',
      href: `/${lang}/exams/mark`
    },
    {
      name: d?.blocks?.results?.title || 'Result',
      href: `/${lang}/exams/result`
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={d?.title || "Exams"}
          className="text-start max-w-none"
        />

        <PageNav pages={examsPages} />

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.totalExams}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <h3>{examsCount}</h3>
              <small className="muted">
                {d?.stats?.allScheduledExams}
              </small>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.upcoming}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <h3>{upcomingExamsCount}</h3>
              <small className="muted">
                {d?.stats?.scheduledForFuture}
              </small>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.questionBank}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <h3>{questionBankCount}</h3>
              <small className="muted">
                {d?.stats?.availableQuestions}
              </small>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.students}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <h3>{studentsEnrolledCount}</h3>
              <small className="muted">
                {d?.stats?.enrolledStudents}
              </small>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.completed}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <h3>{completedExamsCount}</h3>
              <small className="muted">
                {d?.stats?.examsFinished}
              </small>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.pendingMarking}</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <h3>{pendingMarkingCount}</h3>
              <small className="muted">
                {d?.stats?.awaitingGrading}
              </small>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.resultsGenerated}</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <h3>{resultsGeneratedCount}</h3>
              <small className="muted">
                {d?.stats?.studentResults}
              </small>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.templates}</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <h3>{templatesCount}</h3>
              <small className="muted">
                {d?.stats?.examTemplates}
              </small>
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
                {d?.blocks?.manage?.title}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.manage?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="muted">
                {d?.blocks?.manage?.details}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href={`/${lang}/exams`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {d?.blocks?.manage?.viewAll}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/exams/new`}>
                    {d?.blocks?.manage?.createNew}
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
                {d?.blocks?.qbank?.title}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.qbank?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="muted">
                {d?.blocks?.qbank?.details}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/exams/qbank`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {d?.blocks?.qbank?.browse}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/exams/qbank/new`}>
                    {d?.blocks?.qbank?.add}
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
                {d?.blocks?.generate?.title}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.generate?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="muted">
                {d?.blocks?.generate?.details}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/exams/generate`}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {d?.blocks?.generate?.dashboard}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/exams/generate/templates`}>
                    {d?.blocks?.generate?.templates}
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
                {d?.blocks?.mark?.title}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.mark?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="muted">
                {d?.blocks?.mark?.details}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/exams/mark`}>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    {d?.blocks?.mark?.dashboard}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/exams/mark/pending`}>
                    {d?.blocks?.mark?.pending} ({pendingMarkingCount})
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
                {d?.blocks?.results?.title}
              </CardTitle>
              <CardDescription>
                {d?.blocks?.results?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="muted">
                {d?.blocks?.results?.details}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/${lang}/exams/result`}>
                    <FileBarChart className="mr-2 h-4 w-4" />
                    {d?.blocks?.results?.view}
                  </Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/${lang}/exams/result/analytics`}>
                    {d?.blocks?.results?.analytics}
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
                {d?.quickActions?.title}
              </CardTitle>
              <CardDescription>
                {d?.quickActions?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href={`/${lang}/exams/upcoming`}>
                  {d?.quickActions?.viewUpcoming}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href={`/${lang}/exams/mark/pending`}>
                  {d?.quickActions?.gradePending}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href={`/${lang}/exams/result/recent`}>
                  {d?.quickActions?.recentResults}
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href={`/${lang}/exams/qbank/ai-generate`}>
                  {d?.quickActions?.generateAI}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Guide */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.workflow?.title}</CardTitle>
            <CardDescription>
              {d?.workflow?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div>
                  <h3>{d?.workflow?.step1?.title}</h3>
                  <p className="muted">
                    {d?.workflow?.step1?.description}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div>
                  <h3>{d?.workflow?.step2?.title}</h3>
                  <p className="muted">
                    {d?.workflow?.step2?.description}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div>
                  <h3>{d?.workflow?.step3?.title}</h3>
                  <p className="muted">
                    {d?.workflow?.step3?.description}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div>
                  <h3>{d?.workflow?.step4?.title}</h3>
                  <p className="muted">
                    {d?.workflow?.step4?.description}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  5
                </div>
                <div>
                  <h3>{d?.workflow?.step5?.title}</h3>
                  <p className="muted">
                    {d?.workflow?.step5?.description}
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
