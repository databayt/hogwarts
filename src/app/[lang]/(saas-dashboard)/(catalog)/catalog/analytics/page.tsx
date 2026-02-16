import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AnalyticsContent } from "@/components/saas-dashboard/catalog/analytics-content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CatalogAnalyticsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter title="Catalog Analytics" />
      <AnalyticsContent dictionary={dictionary} lang={lang} />
    </>
  )
}
