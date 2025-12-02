import { Metadata } from "next";
import CampaignsContent from '@/components/platform/admission/campaigns-content'
import { SearchParams } from 'nuqs/server'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.school.admission?.campaigns?.title || "Admission Campaigns",
    description: dictionary.school.admission?.description || "Manage admission campaigns",
  };
}

export default async function AdmissionPage({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CampaignsContent searchParams={searchParams} dictionary={dictionary.school} lang={lang} />
}
