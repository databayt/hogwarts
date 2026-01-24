import { type Locale } from "@/components/internationalization/config"
import { StaffContent } from "@/components/platform/listings/staff/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{
    page?: string
    perPage?: string
    search?: string
    sort?: string
    order?: string
    employmentStatus?: string
    employmentType?: string
    departmentId?: string
  }>
}

export default async function StaffPage({ params, searchParams }: Props) {
  const { lang } = await params
  const search = await searchParams

  return <StaffContent locale={lang} searchParams={search} />
}
