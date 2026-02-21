import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ClassroomsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.classes

  const classroomPages: PageNavItem[] = [
    { name: d?.navigation?.all || "All", href: `/${lang}/classrooms` },
    {
      name: d?.navigation?.rooms || "Rooms",
      href: `/${lang}/classrooms/rooms`,
    },
    {
      name: d?.navigation?.configure || "Configure",
      href: `/${lang}/classrooms/configure`,
    },
    {
      name: d?.navigation?.capacity || "Capacity",
      href: `/${lang}/classrooms/capacity`,
    },
    {
      name: d?.navigation?.schedule || "Schedule",
      href: `/${lang}/classrooms/schedule`,
    },
    {
      name: d?.navigation?.settings || "Settings",
      href: `/${lang}/classrooms/settings`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Classrooms"} />
      <PageNav pages={classroomPages} />
      {children}
    </div>
  )
}
