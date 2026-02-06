import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ProfileContent } from "@/components/saas-dashboard/profile/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Profile",
  description: "User profile management",
}

interface Props {
  params: Promise<{ lang: Locale; profile?: string[] }>
}

export default async function Profile({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const profilePages: PageNavItem[] = [
    { name: n?.profile || "Profile", href: `/${lang}/profile` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.profile?.title || "Profile"} />
      <PageNav pages={profilePages} />
      <ProfileContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
