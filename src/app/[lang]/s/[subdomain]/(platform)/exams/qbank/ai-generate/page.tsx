import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const metadata = { title: "AI Question Generation" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function AIGeneratePage({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="AI Generate"
          className="text-start max-w-none"
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {dictionary?.school?.exams?.qbank?.aiGenerateFeature || "AI-Powered Question Generation"}
            </CardTitle>
            <CardDescription>
              {dictionary?.school?.exams?.qbank?.aiGenerateCaption || "This feature is coming soon. AI will help you generate high-quality exam questions automatically."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {dictionary?.school?.exams?.qbank?.aiGenerateCaption || "Capabilities will include: topic-based generation, difficulty level control, Bloom's taxonomy alignment, and bulk question creation."}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
