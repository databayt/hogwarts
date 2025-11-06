import CreateLessonContent from '@/components/platform/lessons/create/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Create Lesson' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CreateLessonContent dictionary={dictionary.school} lang={lang} />
}
