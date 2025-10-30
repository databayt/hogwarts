import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { QuestionBankForm } from "@/components/platform/exams/qbank/form";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";

export const metadata = { title: "Add Question" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function NewQuestionPage({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="New Question"
          className="text-start max-w-none"
        />
        <QuestionBankForm />
      </div>
    </PageContainer>
  );
}
