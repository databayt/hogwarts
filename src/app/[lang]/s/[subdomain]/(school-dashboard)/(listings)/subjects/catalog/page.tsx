import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CatalogSelectionContent } from "@/components/school-dashboard/listings/subjects/catalog/content"

export const metadata = { title: "Dashboard: Subjects - Catalog" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CatalogSelectionContent dictionary={dictionary} lang={lang} />
}
