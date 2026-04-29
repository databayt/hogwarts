// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getNotificationDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { MarkAllReadButton } from "@/components/school-dashboard/notifications/mark-all-read-button"
import { getTabsForRole } from "@/components/school-dashboard/notifications/permissions"
import { getUnreadNotificationCount } from "@/components/school-dashboard/notifications/queries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function NotificationsLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dict = await getNotificationDictionary(lang as Locale)
  const d = dict.notifications
  const role = (session?.user?.role ?? null) as Role | null

  const { schoolId } = await getTenantContext()
  let unreadCount = 0
  if (schoolId && session?.user?.id) {
    unreadCount = await getUnreadNotificationCount(schoolId, session.user.id)
  }

  const notificationPages = getTabsForRole(role, lang, d, unreadCount)

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d.title} />
      <PageNav pages={notificationPages} />
      <MarkAllReadButton label={d.markAllAsRead} unreadCount={unreadCount} />
      {children}
    </div>
  )
}
