import { AttendanceOverviewContent } from '@/components/platform/attendance/overview/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { type Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.title || 'Attendance',
    description: dictionary?.school?.attendance?.overview || 'Manage student attendance',
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)

  return (
    <AttendanceOverviewContent
      dictionary={dictionary}
      locale={lang}
      subdomain={subdomain}
    />
  )
}