import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import type { Locale } from "@/components/internationalization/config";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { type SearchParams } from "nuqs/server";

interface Props {
  dictionary: Dictionary;
  lang: Locale;
  searchParams: Promise<SearchParams>;
}

export default async function ResultsAnalyticsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext();

  // Fetch overall analytics
  let totalExams = 0;
  let totalResults = 0;
  let overallAveragePercentage = 0;
  let passRate = 0;

  if (schoolId) {
    const [examsCount, results] = await Promise.all([
      db.exam.count({ where: { schoolId, status: "COMPLETED" } }),
      db.examResult.findMany({
        where: { schoolId },
        select: {
          percentage: true,
          isAbsent: true,
          marksObtained: true,
          exam: {
            select: {
              passingMarks: true,
            },
          },
        },
      }),
    ]);

    totalExams = examsCount;
    totalResults = results.length;

    const presentResults = results.filter((r) => !r.isAbsent);
    if (presentResults.length > 0) {
      overallAveragePercentage =
        presentResults.reduce((sum, r) => sum + r.percentage, 0) /
        presentResults.length;

      const passedCount = presentResults.filter(
        (r) => r.marksObtained >= r.exam.passingMarks
      ).length;
      passRate = (passedCount / presentResults.length) * 100;
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${lang}/results`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title="Results Analytics"
            description="Comprehensive analysis of exam performance and trends"
            className="text-start max-w-none"
          />
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExams}</div>
              <p className="text-xs text-muted-foreground">
                Total examinations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResults}</div>
              <p className="text-xs text-muted-foreground">
                Student results generated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallAveragePercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Success percentage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Indicators</CardTitle>
            <CardDescription>
              Key metrics and trends in examination results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Overall Performance</p>
                  <p className="text-sm text-muted-foreground">
                    Average across all exams
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {overallAveragePercentage >= 70 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : overallAveragePercentage >= 50 ? (
                    <Minus className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <Badge
                    variant={
                      overallAveragePercentage >= 70
                        ? "default"
                        : overallAveragePercentage >= 50
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {overallAveragePercentage >= 70
                      ? "Excellent"
                      : overallAveragePercentage >= 50
                        ? "Satisfactory"
                        : "Needs Improvement"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pass Rate</p>
                  <p className="text-sm text-muted-foreground">
                    Percentage of students passing
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {passRate >= 80 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : passRate >= 60 ? (
                    <Minus className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <Badge
                    variant={
                      passRate >= 80
                        ? "default"
                        : passRate >= 60
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {passRate.toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Completion Rate</p>
                  <p className="text-sm text-muted-foreground">
                    Exams with results generated
                  </p>
                </div>
                <Badge>100%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for future charts */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>
              Visual analysis and charts (Coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">
              Charts and visualizations will be implemented here
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
