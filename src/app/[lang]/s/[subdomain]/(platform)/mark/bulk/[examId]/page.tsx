import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { Zap } from "lucide-react";

export const metadata = { title: "Bulk Marking" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; examId: string }>;
}

export default async function Page({ params }: Props) {
  const { lang, examId } = await params;
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
      _count: {
        select: {
          examResults: true,
        },
      },
    },
  });

  if (!exam) {
    return notFound();
  }

  const d = dictionary?.marking;

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title={`${d?.bulkMarking || "Bulk Marking"}: ${exam.title}`}
          description={`${exam.class?.name} - ${exam.subject?.subjectName}`}
          className="text-start max-w-none"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {d?.bulkMarkingFeature || "Bulk Marking"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {d?.bulkMarkingDescription || "Grade multiple student submissions at once using automated marking rules."}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {d?.examStats || "Exam Statistics"}:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • {d?.totalMarks || "Total Marks"}: {exam.totalMarks}
                </li>
                <li>
                  • {d?.totalResults || "Total Results"}: {exam._count.examResults}
                </li>
              </ul>
            </div>
            <Button>
              <Zap className="mr-2 h-4 w-4" />
              {d?.startBulkMarking || "Start Bulk Marking"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
