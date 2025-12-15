import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ProfileContent } from "@/components/operator/profile/content"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

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

  // Define profile page navigation
  const profilePages: PageNavItem[] = [
    { name: "Profile", href: `/${lang}/profile` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Profile" />
      <PageNav pages={profilePages} />
      <ProfileContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
