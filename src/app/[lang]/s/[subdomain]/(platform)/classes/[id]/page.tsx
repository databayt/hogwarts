import { ClassDetailContent } from "@/components/platform/classes/detail"
import { getClassById } from "@/components/platform/classes/actions"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Dashboard: Class Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  // Fetch class data
  const result = await getClassById({ id })

  // Handle errors
  if (!result.success) {
    return (
      <ClassDetailContent
        classData={null}
        error={result.error}
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  // Render class detail with data
  return (
    <ClassDetailContent
      classData={result.data ?? null}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
