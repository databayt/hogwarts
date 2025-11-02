import { TeacherDirectoryContent } from '@/components/platform/profile/teacher/directory'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Teacher Profiles' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <TeacherDirectoryContent dictionary={dictionary} lang={lang} />
}