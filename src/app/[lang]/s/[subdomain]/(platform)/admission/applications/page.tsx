import { Metadata } from "next"
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { SearchParams } from 'nuqs/server'
import { ApplicationsContent } from '@/components/platform/admission/applications-content'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.admission?.nav?.applications || "Applications",
    description: "Review and process admission applications",
  }
}

export default async function ApplicationsPage({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <ApplicationsContent
      searchParams={searchParams}
      dictionary={dictionary?.school?.admission}
      lang={lang}
    />
  )
}
