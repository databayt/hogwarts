import { Metadata } from "next"
import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ApplicationsContent from "@/components/platform/admission/applications-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.school.admission?.applications?.title || "Applications",
    description: "View and manage admission applications",
  }
}

export default async function ApplicationsPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <ApplicationsContent
      searchParams={searchParams}
      dictionary={dictionary.school}
      lang={lang}
    />
  )
}
