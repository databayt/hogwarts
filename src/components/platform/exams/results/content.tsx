import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import type { Locale } from "@/components/internationalization/config";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart, Download, TrendingUp } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { type SearchParams } from "nuqs/server";

interface Props {
  dictionary: Dictionary;
  lang: Locale;
  searchParams: Promise<SearchParams>;
}

export default async function ResultsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext();

  // Fetch completed exams with results
  let examsWithResults: Array<{
    id: string;
    title: string;
    examDate: Date;
    className: string;
    subjectName: string;
    totalStudents: number;
    resultsGenerated: number;
    averagePercentage: number | null;
  }> = [];

  if (schoolId) {
    const completedExams = await db.exam.findMany({
      where: {
        schoolId,
        status: "COMPLETED",
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
        examResults: {
          select: {
            id: true,
            percentage: true,
            isAbsent: true,
          },
        },
      },
      orderBy: { examDate: "desc" },
      take: 20,
    });

    examsWithResults = completedExams.map((exam) => {
      const totalStudents = exam.examResults.length;
      const presentResults = exam.examResults.filter((r) => !r.isAbsent);
      const averagePercentage =
        presentResults.length > 0
          ? presentResults.reduce((sum, r) => sum + r.percentage, 0) /
            presentResults.length
          : null;

      return {
        id: exam.id,
        title: exam.title,
        examDate: exam.examDate,
        className: exam.class.name,
        subjectName: exam.subject.subjectName,
        totalStudents,
        resultsGenerated: totalStudents,
        averagePercentage,
      };
    });
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Examination Results"
            description="View, analyze, and export exam results and performance reports"
            className="text-start max-w-none"
          />
          <Button asChild>
            <Link href={`/${lang}/results/analytics`}>
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </div>

        {examsWithResults.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileBarChart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Results Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete and grade exams to generate results
              </p>
              <Button asChild>
                <Link href={`/${lang}/exams`}>Go to Exams</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {examsWithResults.map((exam) => (
              <Card key={exam.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>{exam.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {exam.className} • {exam.subjectName} •{" "}
                      {new Date(exam.examDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/${lang}/results/${exam.id}`}>
                        <FileBarChart className="mr-2 h-4 w-4" />
                        View Results
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{exam.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Results Generated</p>
                      <p className="text-2xl font-bold">{exam.resultsGenerated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold">
                        {exam.averagePercentage !== null
                          ? `${exam.averagePercentage.toFixed(1)}%`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
