import { type Locale } from "@/components/internationalization/config"
import ClassroomsContent from "@/components/school-dashboard/listings/classrooms/content"

export const metadata = { title: "Dashboard: Rooms" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  return <ClassroomsContent lang={lang} />
}
