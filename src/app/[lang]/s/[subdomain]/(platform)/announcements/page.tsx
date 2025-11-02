import { Metadata } from "next";
import AnnouncementsContent from '@/components/platform/announcements/content'
import { SearchParams } from 'nuqs/server'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.school.announcements.title || "Announcements",
    description: dictionary.school.announcements.description || "School announcements and notifications",
  };
}

export default async function AnnouncementsPage({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <AnnouncementsContent searchParams={searchParams} dictionary={dictionary.school} lang={lang} />
}


