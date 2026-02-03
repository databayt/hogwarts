import { Sparkles } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "AI Question Generation" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AIGeneratePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter title="AI Generate" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {dictionary?.school?.exams?.qbank?.aiGenerateFeature ||
                "AI-Powered Question Generation"}
            </CardTitle>
            <CardDescription>
              {dictionary?.school?.exams?.qbank?.aiGenerateCaption ||
                "This feature is coming soon. AI will help you generate high-quality exam questions automatically."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {dictionary?.school?.exams?.qbank?.aiGenerateCaption ||
                "Capabilities will include: topic-based generation, difficulty level control, Bloom's taxonomy alignment, and bulk question creation."}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
