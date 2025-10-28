import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

export const metadata = { title: "Question Details" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>;
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return notFound();
  }

  const question = await db.questionBank.findUnique({
    where: { id, schoolId },
    include: {
      subject: { select: { subjectName: true } },
    },
  });

  if (!question) {
    return notFound();
  }

  const d = dictionary?.school?.exams?.qbank;

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={d?.questionDetails || "Question Details"}
            description={question.subject?.subjectName || ""}
            className="text-start max-w-none"
          />
          <Button asChild>
            <Link href={`/${lang}/generate/questions/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {d?.edit || "Edit"}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{d?.question || "Question"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg whitespace-pre-wrap">{question.questionText}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{d?.type || "Type"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge>{question.questionType}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{d?.difficulty || "Difficulty"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={question.difficulty === "HARD" ? "destructive" : question.difficulty === "MEDIUM" ? "default" : "secondary"}>
                {question.difficulty}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{d?.points || "Points"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{question.points.toString()}</p>
            </CardContent>
          </Card>
        </div>

        {question.bloomLevel && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{d?.bloomLevel || "Bloom's Taxonomy Level"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">{question.bloomLevel}</Badge>
            </CardContent>
          </Card>
        )}

        {question.options && Array.isArray(question.options) && question.options.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{d?.options || "Options"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(question.options as any[]).map((opt: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    {opt.isCorrect && <Badge variant="default" className="text-xs">Correct</Badge>}
                    <span className={opt.isCorrect ? "font-semibold" : ""}>{opt.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {question.sampleAnswer && (
          <Card>
            <CardHeader>
              <CardTitle>{d?.sampleAnswer || "Sample Answer"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{question.sampleAnswer}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
