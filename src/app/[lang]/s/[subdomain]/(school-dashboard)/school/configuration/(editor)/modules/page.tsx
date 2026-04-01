import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigModulesForm } from "@/components/school-dashboard/school/configuration/config-modules-form"

export const metadata = { title: "Configuration: Modules" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ModulesPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  const sidebarDict = dictionary?.platform?.sidebar as
    | Record<string, string>
    | undefined

  return <ConfigModulesForm dictionary={sidebarDict} />
}
