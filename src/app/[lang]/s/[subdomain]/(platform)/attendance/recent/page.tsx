import { RecentActivityContent } from '@/components/platform/attendance/recent/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'
import { UserRole } from '@prisma/client'

export const metadata = { title: 'Dashboard: Recent Attendance Activity' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  return (
    <RecentActivityContent
      dictionary={dictionary.school}
      locale={lang}
      userRole={session?.user?.role as UserRole | undefined}
    />
  )
}
