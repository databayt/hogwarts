// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { ChevronLeft, ChevronRight, Settings } from "lucide-react"

import { getDisplayText } from "@/lib/content-display"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { getNotificationDictionary } from "@/components/internationalization/dictionaries"

import { NotificationCenterClient } from "./notification-center-client"
import { getNotificationsList } from "./queries"
import type { NotificationListFilters } from "./queries"
import type { NotificationDTO } from "./types"

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

  const dict = await getNotificationDictionary(locale as Locale)

  const page = parseInt(searchParams.page || "1", 10)
  const perPage = parseInt(searchParams.perPage || "20", 10)
  const filters: NotificationListFilters = {
    read: searchParams.read,
    type: searchParams.type,
    priority: searchParams.priority,
    search: searchParams.search,
  }

  let notifications: any[] = []
  let totalCount = 0

  try {
    const result = await getNotificationsList(schoolId, session.user.id, {
      page,
      perPage,
      ...filters,
    })

    notifications = result.rows
    totalCount = result.count
  } catch (error) {
    console.error(
      "[NotificationCenterContent] Error fetching notifications:",
      error
    )
  }

  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="space-y-6">
      {/* Header - Airbnb style: large title + settings gear */}
      <div className="flex items-center justify-between">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
          {dict.notifications.title}
        </h1>

        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/notifications/preferences`}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">
              {dict.notifications.preferences.title}
            </span>
          </Link>
        </Button>
      </div>

      {/* Notification List - flat, no card wrapper */}
      <div className="rounded-lg border">
        <NotificationCenterClient
          initialNotifications={
            (await Promise.all(
              (notifications ?? []).map(async (n) => ({
                ...n,
                title: await getDisplayText(
                  n?.title,
                  (n?.lang as "ar" | "en") || "ar",
                  locale,
                  schoolId!
                ),
                body: await getDisplayText(
                  n?.body,
                  (n?.lang as "ar" | "en") || "ar",
                  locale,
                  schoolId!
                ),
                createdAt: safeSerializeDate(n?.createdAt),
                updatedAt: safeSerializeDate(n?.updatedAt),
                readAt: n?.readAt ? safeSerializeDate(n.readAt) : null,
                emailSentAt: n?.emailSentAt
                  ? safeSerializeDate(n.emailSentAt)
                  : null,
                metadata:
                  (n?.metadata as Record<string, unknown> | null) ?? null,
              }))
            )) as NotificationDTO[]
          }
          locale={locale}
          dictionary={dict.notifications}
          showFilters={true}
        />
      </div>

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
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                {dict.notifications.pagination.previous}
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                {dict.notifications.pagination.previous}
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
                {dict.notifications.pagination.next}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            ) : (
              <span>
                {dict.notifications.pagination.next}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Loading state - Airbnb-inspired skeleton
 */
export function NotificationCenterSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* List Skeleton */}
      <div className="rounded-lg border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 border-b px-4 py-3">
            <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-5 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
