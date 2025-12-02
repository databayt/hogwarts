import { Metadata } from "next";
import EnrollmentContent from '@/components/platform/admission/enrollment-content'
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
    title: dictionary.school.admission?.enrollment?.title || "Enrollment",
    description: "Manage student enrollment process",
  };
}

export default async function EnrollmentPage({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <EnrollmentContent searchParams={searchParams} dictionary={dictionary.school} lang={lang} />
}
