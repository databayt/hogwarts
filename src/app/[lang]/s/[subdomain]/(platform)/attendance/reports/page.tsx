import { ReportsContent } from '@/components/platform/attendance/reports/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { SearchParams } from 'nuqs/server'
import { type Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.reports || 'Attendance Reports',
    description: 'Generate and export attendance reports',
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  // Parallel data fetching
  const [{ lang }, dictionary, sp] = await Promise.all([
    params,
    getDictionary((await params).lang),
    searchParams,
  ])

  return (
    <ReportsContent
      dictionary={dictionary}
      locale={lang}
      initialFilters={{
        classId: sp.classId as string | undefined,
        studentId: sp.studentId as string | undefined,
        status: sp.status as string | undefined,
        from: sp.from as string | undefined,
        to: sp.to as string | undefined,
      }}
    />
  )
}



