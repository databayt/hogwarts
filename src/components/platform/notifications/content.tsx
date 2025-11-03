import { Suspense } from "react"
import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { redirect } from "next/navigation"
import { NotificationList } from "./list"
import { getNotificationsList, getNotificationStats } from "./queries"
import type { NotificationListFilters } from "./queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationCenterClient } from "./notification-center-client"
import { Bell, Filter, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

  // Parse search params
  const page = parseInt(searchParams.page || "1", 10)
  const perPage = parseInt(searchParams.perPage || "20", 10)
  const filters: NotificationListFilters = {
    read: searchParams.read,
    type: searchParams.type,
    priority: searchParams.priority,
    search: searchParams.search,
  }

  // Fetch notifications and stats in parallel
  const [notificationsResult, stats] = await Promise.all([
    getNotificationsList(schoolId, session.user.id, {
      page,
      perPage,
      ...filters,
    }),
    getNotificationStats(schoolId, session.user.id),
  ])

  const { rows: notifications, count: totalCount } = notificationsResult
  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with all your school activities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/notifications/preferences`}>
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              Received today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification List with Client-side Updates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {totalCount > 0
                  ? `Showing ${(page - 1) * perPage + 1}-${Math.min(page * perPage, totalCount)} of ${totalCount}`
                  : "No notifications found"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/notifications?${new URLSearchParams(searchParams as Record<string, string>).toString()}`}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationCenterClient
            initialNotifications={notifications.map(n => ({
              ...n,
              metadata: n.metadata as Record<string, unknown> | null
            }))}
            locale={locale}
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
          >
            {page > 1 ? (
              <Link
                href={`/${locale}/notifications?${new URLSearchParams({
                  ...searchParams as Record<string, string>,
                  page: String(page - 1),
                }).toString()}`}
              >
                Previous
              </Link>
            ) : (
              <span>Previous</span>
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
                  asChild={page !== pageNum}
                >
                  {page === pageNum ? (
                    <span>{pageNum}</span>
                  ) : (
                    <Link
                      href={`/${locale}/notifications?${new URLSearchParams({
                        ...searchParams as Record<string, string>,
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
          >
            {page < totalPages ? (
              <Link
                href={`/${locale}/notifications?${new URLSearchParams({
                  ...searchParams as Record<string, string>,
                  page: String(page + 1),
                }).toString()}`}
              >
                Next
              </Link>
            ) : (
              <span>Next</span>
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
