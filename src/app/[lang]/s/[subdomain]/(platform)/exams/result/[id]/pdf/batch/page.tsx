import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { notFound } from "next/navigation";
import { FileDown, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Batch PDF Generation" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>;
}

export default async function BatchPDFPage({ params }: Props) {
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

  const d = dictionary?.results;

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Batch PDF"
          description={`${exam.class?.name} - ${exam.subject?.subjectName}`}
          className="text-start max-w-none"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{d?.pdfTemplates || "PDF Templates"}</CardTitle>
              <CardDescription>
                {d?.chooseTemplate || "Choose a template for the report cards"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="classic" defaultChecked />
                <Label htmlFor="classic" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {d?.classicTemplate || "Classic Template"}
                  <Badge variant="outline">Default</Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="modern" />
                <Label htmlFor="modern" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {d?.modernTemplate || "Modern Template"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="minimal" />
                <Label htmlFor="minimal" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {d?.minimalTemplate || "Minimal Template"}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{d?.pdfOptions || "PDF Options"}</CardTitle>
              <CardDescription>
                {d?.customizeOutput || "Customize the generated reports"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="breakdown" defaultChecked />
                <Label htmlFor="breakdown">
                  {d?.includeBreakdown || "Include question breakdown"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="analytics" defaultChecked />
                <Label htmlFor="analytics">
                  {d?.includeAnalytics || "Include class analytics"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="watermark" />
                <Label htmlFor="watermark">
                  {d?.addWatermark || "Add school watermark"}
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{d?.generation || "Generation"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{d?.totalReports || "Total Reports"}</p>
                <p className="text-sm text-muted-foreground">
                  {exam._count.examResults} {d?.students || "students"}
                </p>
              </div>
              <Badge variant="secondary">
                {d?.estimatedSize || "Est. Size"}: {(exam._count.examResults * 0.5).toFixed(1)} MB
              </Badge>
            </div>
            <Button className="w-full" size="lg">
              <FileDown className="mr-2 h-5 w-5" />
              {d?.generateAll || "Generate All PDFs"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
