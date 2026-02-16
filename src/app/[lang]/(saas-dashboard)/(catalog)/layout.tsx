import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function CatalogLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const n = dictionary?.operator?.nav

  const catalogPages: PageNavItem[] = [
    { name: n?.catalog || "Catalog", href: `/${lang}/catalog` },
  ]

  return (
    <>
      <PageNav pages={catalogPages} />
      {children}
    </>
  )
}
