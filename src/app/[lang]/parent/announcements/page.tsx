import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { ParentAnnouncementsContent } from "@/components/school-dashboard/parent-portal/announcements/content"

export const metadata: Metadata = {
  title: "Announcements | Parent Portal",
  description: "View school and class announcements for your children",
}

export default async function ParentAnnouncements({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  return <ParentAnnouncementsContent lang={lang} />
}
