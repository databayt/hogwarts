import { Suspense } from "react"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"
import { NotificationCenterContent, NotificationCenterSkeleton } from "@/components/platform/notifications/content"

interface NotificationsPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
  searchParams: Promise<{
    page?: string
    perPage?: string
    read?: string
    type?: string
    priority?: string
    sort?: string
    search?: string
  }>
}

export async function generateMetadata({ params }: NotificationsPageProps) {
  const { lang } = await params

  return {
    title: `Notifications | Hogwarts`,
    description: "View and manage your notifications",
  }
}

export default async function NotificationsPage({
  params,
  searchParams,
}: NotificationsPageProps) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams

  return (
    <div className="container py-6">
      <Suspense fallback={<NotificationCenterSkeleton />}>
        <NotificationCenterContent
          locale={lang}
          searchParams={resolvedSearchParams}
        />
      </Suspense>
    </div>
  )
}
