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

  // Safe access to profile dictionary with fallbacks
  const profileDict = dictionary?.profile
  const profileNav = profileDict?.navigation

  // Define navigation items for profile section with safe fallbacks
  const profilePages: PageNavItem[] = [
    {
      name: profileNav?.overview ?? 'Overview',
      href: `/${lang}/profile`,
    },
    {
      name: profileNav?.students ?? 'Students',
      href: `/${lang}/profile/students`,
      hidden: true,
    },
    {
      name: profileNav?.teachers ?? 'Teachers',
      href: `/${lang}/profile/teachers`,
      hidden: true,
    },
    {
      name: profileNav?.parents ?? 'Parents',
      href: `/${lang}/profile/parents`,
      hidden: true,
    },
    {
      name: profileNav?.staff ?? 'Staff',
      href: `/${lang}/profile/staff`,
      hidden: true,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={profileDict?.title ?? 'Profile'}
        className="text-start max-w-none"
      />
      <PageNav pages={profilePages} />
      {children}
    </div>
  )
}
