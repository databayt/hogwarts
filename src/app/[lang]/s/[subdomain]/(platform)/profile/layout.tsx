import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'
import { getDictionary } from '@/components/internationalization/dictionaries'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ProfileLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.profile

  // Define navigation items for profile section
  const profilePages: PageNavItem[] = [
    {
      name: d?.navigation?.overview || 'Overview',
      href: `/${lang}/profile`,
    },
    {
      name: d?.navigation?.students || 'Students',
      href: `/${lang}/profile/students`,
      hidden: true,
    },
    {
      name: d?.navigation?.teachers || 'Teachers',
      href: `/${lang}/profile/teachers`,
      hidden: true,
    },
    {
      name: d?.navigation?.parents || 'Parents',
      href: `/${lang}/profile/parents`,
      hidden: true,
    },
    {
      name: d?.navigation?.staff || 'Staff',
      href: `/${lang}/profile/staff`,
      hidden: true,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Profile'}
        className="text-start max-w-none"
      />
      <PageNav pages={profilePages} />
      {children}
    </div>
  )
}
