import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ApprovalContent } from "@/components/saas-dashboard/catalog/approval-content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CatalogApprovalsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter title="Content Approvals" />
      <ApprovalContent dictionary={dictionary} lang={lang} />
    </>
  )
}
