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
import { Calendar, Clock, Users } from "lucide-react";

export const metadata = { title: "Upcoming Exams" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingExams = schoolId
    ? await db.exam.findMany({
        where: {
          schoolId,
          status: { in: ["PLANNED", "IN_PROGRESS"] },
          examDate: { gte: today },
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
          examDate: "asc",
        },
        take: 20,
      })
    : [];

  const d = dictionary?.school?.exams;

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.upcomingExams || "Upcoming Exams"}
          description={d?.upcomingDescription || "Scheduled examinations"}
          className="text-start max-w-none"
        />

        {upcomingExams.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {d?.noUpcomingExams || "No upcoming exams scheduled"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingExams.map((exam) => (
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
                    <Clock className="h-4 w-4" />
                    {exam.startTime} - {exam.endTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{exam.class?.name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{exam.subject?.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exam.status === "PLANNED" ? "secondary" : "default"}>
                      {exam.status}
                    </Badge>
                    <Badge variant="outline">
                      {exam.totalMarks} {d?.marks || "marks"}
                    </Badge>
                  </div>
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/${lang}/exams/${exam.id}`}>
                      {d?.viewDetails || "View Details"}
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
