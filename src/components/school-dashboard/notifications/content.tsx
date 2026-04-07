// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

function safeSerializeDate(date: Date | null | undefined): string | null {
  if (!date) return null
  try {
    return new Date(date).toISOString()
  } catch {
    return null
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
  const [session, { schoolId }, dict] = await Promise.all([
    auth(),
    getTenantContext(),
    getNotificationDictionary(locale as Locale),
  ])
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }
  if (!schoolId) {
    redirect(`/${locale}/dashboard`)
  }

  const page = parseInt(searchParams.page || "1", 10)
  const perPage = parseInt(searchParams.perPage || "20", 10)
  const filters: NotificationListFilters = {
    read: searchParams.read,
    type: searchParams.type,
    priority: searchParams.priority,
    search: searchParams.search,
  }

  let rows: Awaited<ReturnType<typeof getNotificationsList>>["rows"] = []
  let totalCount = 0

  try {
    const result = await getNotificationsList(schoolId, session.user.id, {
      page,
      perPage,
      ...filters,
    })

    rows = result.rows
    totalCount = result.count
  } catch (error) {
    console.error(
      "[NotificationCenterContent] Error fetching notifications:",
      error
    )
  }

  const totalPages = Math.ceil(totalCount / perPage)

  // Translate title+body in parallel per notification, all notifications in parallel
  const translatedNotifications = (await Promise.all(
    rows.map(async (n) => {
      const contentLang = (n.lang as "ar" | "en") || "ar"
      const [title, body] = await Promise.all([
        getDisplayText(n.title, contentLang, locale, schoolId),
        getDisplayText(n.body, contentLang, locale, schoolId),
      ])
      return {
        ...n,
        title,
        body,
        createdAt: safeSerializeDate(n.createdAt) ?? new Date().toISOString(),
        updatedAt: safeSerializeDate(n.updatedAt) ?? new Date().toISOString(),
        readAt: safeSerializeDate(n.readAt),
        emailSentAt: safeSerializeDate(n.emailSentAt),
        metadata: (n.metadata as Record<string, unknown> | null) ?? null,
      }
    })
  )) as NotificationDTO[]

  return (
    <div className="space-y-6">
      <div>
        <NotificationCenterClient
          initialNotifications={translatedNotifications}
          locale={locale}
          dictionary={dict.notifications}
          showFilters={false}
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
  )
}
