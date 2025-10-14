import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSchoolBySubdomain } from '@/lib/subdomain-actions'
import { TimetableContent } from '@/components/platform/timetable/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { getCurrentDomain } from '@/components/site/utils'
import { generateSchoolMetadata, generateDefaultMetadata } from '@/components/site/metadata'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)
  const { rootDomain } = await getCurrentDomain()

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain)
  }

  return generateSchoolMetadata({
    school: result.data,
    subdomain,
    rootDomain
  })
}

export default async function Page({ params }: Props) {
  const { subdomain, lang } = await params
  const dictionary = await getDictionary(lang)
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  const school = result.data

  return (
    <div className="school-content" data-school-id={school.id} data-subdomain={subdomain}>
      <TimetableContent dictionary={dictionary.school} />
    </div>
  )
}







