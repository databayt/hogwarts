import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DomainsContent } from "@/components/operator/domains/content"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

export const metadata = {
  title: "Domains",
  description: "Manage domain requests and configurations",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Domains({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  // Define domains page navigation
  const domainsPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/tenants` },
    { name: "Domains", href: `/${lang}/domains` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Domains" />
      <PageNav pages={domainsPages} />
      <DomainsContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
