import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TenantsContent } from "@/components/saas-dashboard/tenants/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Tenant Management",
  description: "Manage school subdomains and tenant settings",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Tenants({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  // Define tenants page navigation
  const tenantsPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/tenants` },
    { name: "Domains", href: `/${lang}/domains` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Tenants" />
      <PageNav pages={tenantsPages} />
      <TenantsContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
