import { Metadata } from "next";
import MeritContent from '@/components/platform/admission/merit-content'
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
    title: dictionary.school.admission?.meritList?.title || "Merit List",
    description: "View and manage admission merit rankings",
  };
}

export default async function MeritPage({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <MeritContent searchParams={searchParams} dictionary={dictionary.school} lang={lang} />
}
