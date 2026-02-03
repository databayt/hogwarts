import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ObservabilityContent } from "@/components/saas-dashboard/observability/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Observability",
  description: "System logs and audit trails",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Observability({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  // Define observability page navigation
  const observabilityPages: PageNavItem[] = [
    { name: "Logs", href: `/${lang}/observability` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Observability" />
      <PageNav pages={observabilityPages} />
      <ObservabilityContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
