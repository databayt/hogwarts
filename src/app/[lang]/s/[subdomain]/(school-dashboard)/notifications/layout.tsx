// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getNotificationDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { MarkAllReadButton } from "@/components/school-dashboard/notifications/mark-all-read-button"
import { getUnreadNotificationCount } from "@/components/school-dashboard/notifications/queries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function NotificationsLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dict = await getNotificationDictionary(lang as Locale)
  const d = dict.notifications

  const { schoolId } = await getTenantContext()
  let unreadCount = 0
  if (schoolId && session?.user?.id) {
    unreadCount = await getUnreadNotificationCount(schoolId, session.user.id)
  }

  const basePath = `/${lang}/notifications`

  const notificationPages: PageNavItem[] = [
    { name: d.tabs.all, href: basePath, exact: true },
    {
      name: d.tabs.unread,
      href: `${basePath}/unread`,
      badge: unreadCount,
    },
    { name: d.actions.settings, href: `${basePath}/preferences` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d.title} />
      <PageNav pages={notificationPages} />
      <MarkAllReadButton label={d.markAllAsRead} unreadCount={unreadCount} />
      {children}
    </div>
  )
}
