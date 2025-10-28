import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";

export const metadata = { title: "Create Template" };

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title={dictionary?.school?.exams?.generate?.createTemplate || "Create Exam Template"}
          description={dictionary?.school?.exams?.generate?.templateDescription || "Design a reusable exam template"}
          className="text-start max-w-none"
        />
        {/* Template form component will go here */}
      </div>
    </PageContainer>
  );
}
