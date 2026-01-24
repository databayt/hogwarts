import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import DepartmentsContent from "@/components/platform/listings/teachers/departments/content"

export const metadata = { title: "Dashboard: Departments" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <DepartmentsContent dictionary={dictionary.school} lang={lang} />
}
