import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AssignmentContent } from "@/components/saas-dashboard/catalog/assignment-content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CatalogAssignmentsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter title="Catalog Assignments" />
      <AssignmentContent dictionary={dictionary} lang={lang} />
    </>
  )
}
