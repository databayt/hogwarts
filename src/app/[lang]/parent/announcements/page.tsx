import { Metadata } from "next"

import { ParentAnnouncementsContent } from "@/components/school-dashboard/parent-portal/announcements/content"

export const metadata: Metadata = {
  title: "Announcements | Parent Portal",
  description: "View school and class announcements for your children",
}

export default function ParentAnnouncements() {
  return <ParentAnnouncementsContent />
}
