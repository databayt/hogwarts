import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AdminLayout({ children, params }: Props) {
  const session = await auth()
  const { lang } = await params

  // Only allow ADMIN or DEVELOPER roles to access admin panel
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DEVELOPER')) {
    redirect(`/${lang}/unauthorized`)
  }

  return <>{children}</>
}