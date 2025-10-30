import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, Calendar, Users } from "lucide-react";

export const metadata = { title: "Pending Exams - Marking" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function PendingPage({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingExams = schoolId
    ? await db.exam.findMany({
        where: {
          schoolId,
          status: "IN_PROGRESS",
          examDate: { lt: today },
        },
        include: {
          class: { select: { name: true } },
          subject: { select: { subjectName: true } },
          _count: {
            select: {
              examResults: true,
            },
          },
        },
        orderBy: {
          examDate: "desc",
        },
      })
    : [];

  const d = dictionary?.marking;

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Pending"
          className="text-start max-w-none"
        />

        {pendingExams.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {d?.noPendingExams || "No pending exams to grade"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingExams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{exam.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(exam.examDate).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{exam.class?.name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{exam.subject?.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      {d?.pending || "Pending"}
                    </Badge>
                    <Badge variant="secondary">
                      {exam._count.examResults} {d?.results || "results"}
                    </Badge>
                  </div>
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/${lang}/exams/mark/grade/${exam.id}`}>
                      {d?.startGrading || "Start Grading"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
