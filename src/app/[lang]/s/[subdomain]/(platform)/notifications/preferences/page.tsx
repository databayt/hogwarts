import { Suspense } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { NotificationPreferencesContent } from "@/components/platform/notifications/preferences-content"

interface NotificationPreferencesPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export async function generateMetadata({
  params,
}: NotificationPreferencesPageProps) {
  const { lang } = await params

  return {
    title: `Notification Preferences | Hogwarts`,
    description: "Manage your notification preferences and settings",
  }
}

function PreferencesSkeleton() {
  return (
    <div className="space-y-6 py-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Form Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* More Cards */}
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function NotificationPreferencesPage({
  params,
}: NotificationPreferencesPageProps) {
  const { lang } = await params

  return (
    <div className="py-6">
      <Suspense fallback={<PreferencesSkeleton />}>
        <NotificationPreferencesContent locale={lang} />
      </Suspense>
    </div>
  )
}
