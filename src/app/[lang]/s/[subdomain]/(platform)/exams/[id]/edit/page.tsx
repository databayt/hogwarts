import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { ExamCreateForm } from "@/components/platform/exams/manage/form";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";

export const metadata = { title: "Edit Exam" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>;
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={dictionary?.school?.exams?.editExam || "Edit Exam"}
          description={dictionary?.school?.exams?.description || "Update examination details"}
          className="text-start max-w-none"
        />
        <ExamCreateForm />
      </div>
    </PageContainer>
  );
}
