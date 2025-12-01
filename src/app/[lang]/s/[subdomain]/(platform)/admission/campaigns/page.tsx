import { Metadata } from "next"
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { SearchParams } from 'nuqs/server'
import { CampaignsContent } from '@/components/platform/admission/campaigns-content'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.admission?.nav?.campaigns || "Admission Campaigns",
    description: "Manage admission campaigns for different academic years",
  }
}

export default async function CampaignsPage({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <CampaignsContent
      searchParams={searchParams}
      dictionary={dictionary?.school?.admission}
      lang={lang}
    />
  )
}
