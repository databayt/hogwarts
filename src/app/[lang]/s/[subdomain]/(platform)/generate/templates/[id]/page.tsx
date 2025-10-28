import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

export const metadata = { title: "Template Details" };

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

  const template = await db.examTemplate.findUnique({
    where: { id, schoolId },
    include: {
      subject: { select: { subjectName: true } },
    },
  });

  if (!template) {
    return notFound();
  }

  const d = dictionary?.school?.exams?.generate;

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={template.name}
            description={template.description || d?.templateDetails || "Template Details"}
            className="text-start max-w-none"
          />
          <Button asChild>
            <Link href={`/${lang}/generate/templates/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {d?.edit || "Edit"}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{d?.subject || "Subject"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{template.subject?.subjectName}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{d?.duration || "Duration"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{template.duration} minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{d?.totalMarks || "Total Marks"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{template.totalMarks.toString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
