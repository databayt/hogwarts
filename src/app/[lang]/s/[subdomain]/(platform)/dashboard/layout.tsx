import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function DashboardLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.dashboard

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Overview"} />
      {children}
    </div>
  )
}
