import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DomainsContent } from "@/components/saas-dashboard/domains/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

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

  const n = d?.nav
  const domainsPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/tenants` },
    { name: n?.domains || "Domains", href: `/${lang}/domains` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.domains?.title || "Domains"} />
      <PageNav pages={domainsPages} />
      <DomainsContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
