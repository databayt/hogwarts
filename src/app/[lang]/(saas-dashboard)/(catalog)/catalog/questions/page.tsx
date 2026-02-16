import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { QuestionContent } from "@/components/saas-dashboard/catalog/question-content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Catalog Questions",
  description: "Manage global question bank for the curriculum catalog",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CatalogQuestionsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter title="Questions" />
      <QuestionContent dictionary={dictionary} lang={lang} />
    </>
  )
}
