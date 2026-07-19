import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigModulesForm } from "@/components/school-dashboard/school/configuration/config-modules-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.modules?.title ||
      "Configuration: Modules",
  }
}

export default async function ModulesPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  const sidebarDict = dictionary?.platform?.sidebar as
    | Record<string, string>
    | undefined

  return <ConfigModulesForm dictionary={sidebarDict} />
}
