import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { CampaignDetail } from '@/components/platform/admission/campaign-detail'
import { getCampaignById } from '@/components/platform/admission/actions'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const campaign = await getCampaignById(id)

  return {
    title: campaign?.name || dictionary?.school?.admission?.nav?.campaigns || "Campaign Details",
    description: `Admission campaign details and configuration`,
  }
}

export default async function CampaignDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const campaign = await getCampaignById(id)

  if (!campaign) {
    notFound()
  }

  return (
    <CampaignDetail
      campaign={campaign}
      dictionary={dictionary?.school?.admission}
      lang={lang}
    />
  )
}
