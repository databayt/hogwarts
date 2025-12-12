import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { redirect } from "next/navigation"
import { getNotificationsList, getNotificationStats } from "./queries"
import type { NotificationListFilters } from "./queries"
import type { NotificationDTO } from "./types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationCenterClient } from "./notification-center-client"
import { Bell, Calendar, TrendingUp, Inbox, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getNotificationDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"

// Helper function to safely serialize dates
function safeSerializeDate(date: Date | null | undefined): string {
  if (!date) return new Date().toISOString()
  try {
    return new Date(date).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

interface NotificationCenterContentProps {
  locale?: "ar" | "en"
  searchParams?: {
    page?: string
    perPage?: string
    read?: string
    type?: string
    priority?: string
    sort?: string
    search?: string
  }
}

export async function NotificationCenterContent({
  locale = "en",
  searchParams = {},
}: NotificationCenterContentProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    redirect(`/${locale}/dashboard`)
  }

  // Load dictionary
  const dict = await getNotificationDictionary(locale as Locale)

  // Parse search params
  const page = parseInt(searchParams.page || "1", 10)
  const perPage = parseInt(searchParams.perPage || "20", 10)
  const filters: NotificationListFilters = {
    read: searchParams.read,
    type: searchParams.type,
    priority: searchParams.priority,
    search: searchParams.search,
  }

  // Fetch notifications and stats with error handling
  let notifications: any[] = []
  let totalCount = 0
  let stats = {
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0,
    byType: {} as Record<any, number>,
    byPriority: {} as Record<any, number>,
  }

  try {
    const [notificationsResult, statsResult] = await Promise.all([
      getNotificationsList(schoolId, session.user.id, {
        page,
        perPage,
        ...filters,
      }),
      getNotificationStats(schoolId, session.user.id),
    ])

    notifications = notificationsResult.rows
    totalCount = notificationsResult.count
    stats = statsResult
  } catch (error) {
    console.error("[NotificationCenterContent] Error fetching notifications:", error)
  }

  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
            {dict.notifications.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {dict.notifications.subtitle}
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/notifications/preferences`}>
            <Settings className="h-4 w-4 me-2" />
            {dict.notifications.preferences.title}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.notifications.statistics.totalReceived}
            </CardTitle>
            <div className="rounded-full bg-muted p-2">
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.notifications.tabs.all}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.notifications.tabs.unread}
            </CardTitle>
            <div className="rounded-full bg-destructive/10 p-2">
              <Bell className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.notifications.statistics.totalUnread}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.notifications.grouping.today}
            </CardTitle>
            <div className="rounded-full bg-muted p-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.notifications.grouping.today}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.notifications.statistics.thisWeek}
            </CardTitle>
            <div className="rounded-full bg-muted p-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.notifications.grouping.thisWeek}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification List with Client-side Updates */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>{dict.notifications.tabs.all}</CardTitle>
              <CardDescription className="mt-1">
                {totalCount > 0
                  ? `${dict.notifications.common.showing} ${(page - 1) * perPage + 1}-${Math.min(page * perPage, totalCount)} ${dict.notifications.common.of} ${totalCount}`
                  : dict.notifications.empty.noNotifications}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <NotificationCenterClient
            initialNotifications={(notifications ?? []).map((n) => ({
              ...n,
              createdAt: safeSerializeDate(n?.createdAt),
              updatedAt: safeSerializeDate(n?.updatedAt),
              readAt: n?.readAt ? safeSerializeDate(n.readAt) : null,
              emailSentAt: n?.emailSentAt ? safeSerializeDate(n.emailSentAt) : null,
              metadata: (n?.metadata as Record<string, unknown> | null) ?? null,
            })) as NotificationDTO[]}
            locale={locale}
            dictionary={dict.notifications}
            showFilters={true}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            asChild={page > 1}
            className="gap-1"
          >
            {page > 1 ? (
              <Link
                href={`/${locale}/notifications?${new URLSearchParams({
                  ...(searchParams as Record<string, string>),
                  page: String(page - 1),
                }).toString()}`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </span>
            )}
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  asChild={page !== pageNum}
                >
                  {page === pageNum ? (
                    <span>{pageNum}</span>
                  ) : (
                    <Link
                      href={`/${locale}/notifications?${new URLSearchParams({
                        ...(searchParams as Record<string, string>),
                        page: String(pageNum),
                      }).toString()}`}
                    >
                      {pageNum}
                    </Link>
                  )}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            asChild={page < totalPages}
            className="gap-1"
          >
            {page < totalPages ? (
              <Link
                href={`/${locale}/notifications?${new URLSearchParams({
                  ...(searchParams as Record<string, string>),
                  page: String(page + 1),
                }).toString()}`}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Loading state for notification center
 */
export function NotificationCenterSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
