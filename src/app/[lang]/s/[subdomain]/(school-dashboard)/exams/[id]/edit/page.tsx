import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { ExamCreateForm } from "@/components/school-dashboard/exams/manage/form"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "Edit Exam" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeadingSetter
          title={dictionary?.school?.exams?.editExam || "Edit Exam"}
          description={
            dictionary?.school?.exams?.description ||
            "Update examination details"
          }
        />
        <ExamCreateForm />
      </div>
    </PageContainer>
  )
}
