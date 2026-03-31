// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"

import type { Locale } from "@/components/internationalization/config"
import { getNotificationDictionary } from "@/components/internationalization/dictionaries"
import {
  NotificationCenterContent,
  NotificationCenterSkeleton,
} from "@/components/school-dashboard/notifications/content"

interface UnreadNotificationsPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
  searchParams: Promise<{
    page?: string
    perPage?: string
  }>
}

export async function generateMetadata({
  params,
}: UnreadNotificationsPageProps) {
  const { lang } = await params
  const dict = await getNotificationDictionary(lang)

  return {
    title: `${dict.notifications.tabs.unread} - ${dict.notifications.title}`,
  }
}

export default async function UnreadNotificationsPage({
  params,
  searchParams,
}: UnreadNotificationsPageProps) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams

  return (
    <Suspense fallback={<NotificationCenterSkeleton />}>
      <NotificationCenterContent
        locale={lang}
        searchParams={{ ...resolvedSearchParams, read: "false" }}
      />
    </Suspense>
  )
}
