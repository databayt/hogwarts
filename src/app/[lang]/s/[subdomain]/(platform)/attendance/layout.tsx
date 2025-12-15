import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AttendanceLayout({ children, params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.attendance

  const basePath = `/${lang}/s/${subdomain}/attendance`

  // Attendance page navigation (6 links)
  const attendancePages: PageNavItem[] = [
    { name: d?.manual || "Mark", href: basePath },
    { name: "QR Code", href: `${basePath}/qr-code` },
    { name: "Barcode", href: `${basePath}/barcode` },
    { name: d?.analytics || "Analytics", href: `${basePath}/analytics` },
    { name: d?.reports || "Reports", href: `${basePath}/reports` },
    { name: d?.settings || "Settings", href: `${basePath}/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Attendance"} />
      <PageNav pages={attendancePages} />

      {children}
    </div>
  )
}
