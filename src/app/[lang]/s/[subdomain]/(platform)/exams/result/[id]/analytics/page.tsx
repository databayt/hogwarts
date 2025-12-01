import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { TrendingUp, Users, Award, AlertCircle } from "lucide-react";

export const metadata = { title: "Exam Analytics" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>;
}

export default async function ExamAnalyticsPage({ params }: Props) {
  const { lang, id: examId } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return notFound();
  }

  const exam = await db.exam.findUnique({
    where: { id: examId, schoolId },
    include: {
      class: { select: { name: true } },
      subject: { select: { subjectName: true } },
      examResults: {
        select: {
          marksObtained: true,
          percentage: true,
          grade: true,
        },
      },
    },
  });

  if (!exam) {
    return notFound();
  }

  const totalResults = exam.examResults.length;
  const averageMarks = totalResults > 0
    ? exam.examResults.reduce((sum, r) => sum + (r.marksObtained || 0), 0) / totalResults
    : 0;
  const passCount = exam.examResults.filter(r => (r.marksObtained || 0) >= exam.passingMarks).length;
  const passRate = totalResults > 0 ? (passCount / totalResults) * 100 : 0;
  const topScore = totalResults > 0
    ? Math.max(...exam.examResults.map(r => r.marksObtained || 0))
    : 0;

  const d = dictionary?.results;

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter
          title="Analytics"
          description={`${exam.class?.name} - ${exam.subject?.subjectName}`}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.totalStudents || "Total Students"}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResults}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.averageScore || "Average Score"}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageMarks.toFixed(1)}/{exam.totalMarks}
              </div>
              <p className="text-xs text-muted-foreground">
                {((averageMarks / exam.totalMarks) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.passRate || "Pass Rate"}</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {passCount} / {totalResults} {d?.passed || "passed"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.topScore || "Top Score"}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topScore}/{exam.totalMarks}
              </div>
              <p className="text-xs text-muted-foreground">
                {((topScore / exam.totalMarks) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{d?.performanceDistribution || "Performance Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {d?.detailedAnalytics || "Detailed analytics and visualizations coming soon."}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
