import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import type { Locale } from "@/components/internationalization/config";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { getExamResults, getExamAnalytics } from "./actions";
import { formatPercentage, formatMarks, getRankSuffix } from "./utils";

interface Props {
  dictionary: Dictionary;
  lang: Locale;
  examId: string;
}

export default async function ResultDetailContent({ dictionary, lang, examId }: Props) {
  // Fetch exam results and analytics
  const [resultsResponse, analyticsResponse] = await Promise.all([
    getExamResults({ examId, includeAbsent: true, includeQuestionBreakdown: false }),
    getExamAnalytics({ examId }),
  ]);

  const r = dictionary?.results;

  if (!resultsResponse.success || !resultsResponse.data) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{r?.messages?.failedToLoad || "Failed to load results"}</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const results = resultsResponse.data;
  const analytics = analyticsResponse.success ? analyticsResponse.data : null;
  const summary = analytics?.summary;

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${lang}/results`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <PageHeader
              title={summary?.examTitle || (r?.labels?.examResults || "Exam Results")}
              description={`${summary?.className || ""} • ${summary?.subjectName || ""} • ${summary?.examDate ? new Date(summary.examDate).toLocaleDateString() : ""}`}
              className="text-start max-w-none"
            />
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {r?.actions?.exportAllPDFs || "Export All PDFs"}
          </Button>
        </div>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{r?.statistics?.totalStudents || "Total Students"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.presentStudents} {r?.labels?.present || "present"}, {summary.absentStudents} {r?.labels?.absent || "absent"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{r?.statistics?.passRate || "Pass Rate"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.presentStudents > 0
                    ? `${((summary.passedStudents / summary.presentStudents) * 100).toFixed(1)}%`
                    : (r?.labels?.notAvailable || "N/A")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.passedStudents} {r?.labels?.passed || "passed"}, {summary.failedStudents} {r?.labels?.failed || "failed"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{r?.statistics?.averageScore || "Average Score"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(summary.averagePercentage)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatMarks(summary.averageMarks, summary.totalMarks)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{r?.statistics?.scoreRange || "Score Range"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.lowestMarks} - {summary.highestMarks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of {summary.totalMarks} marks
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student Results List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Results</CardTitle>
            <CardDescription>
              Individual performance and rankings for all students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {getRankSuffix(result.rank)}
                      </Badge>
                      <div>
                        <h4 className="font-medium">{result.studentName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.studentId}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Marks</p>
                      <p className="font-semibold">
                        {formatMarks(result.marksObtained, result.totalMarks)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Percentage</p>
                      <p className="font-semibold">
                        {formatPercentage(result.percentage)}
                      </p>
                    </div>

                    {result.grade && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Grade</p>
                        <Badge>{result.grade}</Badge>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          result.isAbsent
                            ? "secondary"
                            : result.marksObtained >= (summary?.passingMarks || 0)
                              ? "default"
                              : "destructive"
                        }
                      >
                        {result.isAbsent
                          ? "Absent"
                          : result.marksObtained >= (summary?.passingMarks || 0)
                            ? "Pass"
                            : "Fail"}
                      </Badge>
                    </div>

                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
