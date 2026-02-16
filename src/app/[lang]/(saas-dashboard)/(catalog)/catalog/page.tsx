import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CatalogContent } from "@/components/saas-dashboard/catalog/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Catalog Management",
  description:
    "Manage global curriculum catalog subjects, chapters, and lessons",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CatalogPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter title="Catalog" />
      <CatalogContent dictionary={dictionary} lang={lang} />
    </>
  )
}
