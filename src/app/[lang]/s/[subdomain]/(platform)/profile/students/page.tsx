import { StudentDirectoryContent } from '@/components/platform/profile/student/directory'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Student Profiles' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <StudentDirectoryContent dictionary={dictionary} lang={lang} />
}