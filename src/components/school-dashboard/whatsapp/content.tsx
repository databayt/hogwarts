// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { WhatsAppDashboardClient } from "./dashboard-client"
import {
  getWhatsAppGroups,
  getWhatsAppMessages,
  getWhatsAppSession,
  getWhatsAppStats,
  getWhatsAppTemplates,
} from "./queries"

export interface WhatsAppContentProps {
  locale?: Locale
}

export async function WhatsAppContent({ locale = "en" }: WhatsAppContentProps) {
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Please sign in</p>
      </div>
    )
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No school context found</p>
      </div>
    )
  }

  const dictionary = await getDictionary(locale)

  const [waSession, groups, messages, templates, stats] = await Promise.all([
    getWhatsAppSession(schoolId),
    getWhatsAppGroups(schoolId),
    getWhatsAppMessages(schoolId, { limit: 20 }),
    getWhatsAppTemplates(schoolId),
    getWhatsAppStats(schoolId),
  ])

  return (
    <WhatsAppDashboardClient
      session={waSession}
      groups={groups}
      messages={messages}
      templates={templates}
      stats={stats}
      dictionary={dictionary}
      locale={locale}
    />
  )
}

export function WhatsAppContentSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-9 w-96" />

      {/* Content skeleton */}
      <div className="space-y-4 rounded-xl border p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
