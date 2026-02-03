import { redirect } from "next/navigation"
import { auth } from "@/auth"
import {
  AlertTriangle,
  Bell,
  Inbox,
  Mail,
  MessageSquare,
  Moon,
  Settings,
  Smartphone,
} from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getNotificationDictionary } from "@/components/internationalization/dictionaries"

import { NotificationPreferencesForm } from "./preferences-form"
import { getUserNotificationPreferences } from "./queries"

interface NotificationPreferencesContentProps {
  locale?: "ar" | "en"
}

export async function NotificationPreferencesContent({
  locale = "en",
}: NotificationPreferencesContentProps) {
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

  // Fetch user's current preferences
  const rawPreferences = await getUserNotificationPreferences(
    schoolId,
    session.user.id
  )

  // Transform to match form interface
  const preferences = rawPreferences.map((pref) => ({
    type: pref.type,
    channel: pref.channel,
    enabled: pref.enabled,
    quietHoursStart: pref.quietHoursStart,
    quietHoursEnd: pref.quietHoursEnd,
    digestEnabled: pref.digestEnabled,
    digestFrequency: pref.digestFrequency as "daily" | "weekly" | null,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
          {dict.notifications.preferences.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {dict.notifications.preferences.description}
        </p>
      </div>

      {/* Preferences Form */}
      <NotificationPreferencesForm
        initialPreferences={preferences}
        locale={locale}
        dictionary={dict.notifications}
      />

      {/* Help Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="text-muted-foreground h-5 w-5" />
            <CardTitle className="text-lg">
              {dict.notifications.preferences.channelSettings}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h4 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4" />
              {dict.notifications.preferences.deliveryMethods}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Bell className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">
                    {dict.notifications.channels.in_app}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {dict.notifications.channels.descriptions.in_app}
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Mail className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">
                    {dict.notifications.channels.email}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {dict.notifications.channels.descriptions.email}
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Smartphone className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">
                    {dict.notifications.channels.push}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {dict.notifications.channels.descriptions.push}
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">
                    {dict.notifications.channels.sms}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {dict.notifications.channels.descriptions.sms}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="border-t pt-4">
            <h4 className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
              <Moon className="h-4 w-4" />
              {dict.notifications.preferences.quietHours.title}
            </h4>
            <p className="text-muted-foreground text-sm">
              {dict.notifications.preferences.quietHours.description}
            </p>
          </div>

          {/* Notification Digest */}
          <div className="border-t pt-4">
            <h4 className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
              <Inbox className="h-4 w-4" />
              {dict.notifications.preferences.digest.title}
            </h4>
            <p className="text-muted-foreground text-sm">
              {dict.notifications.preferences.digest.description}
            </p>
          </div>

          {/* Action Required */}
          <div className="border-t pt-4">
            <h4 className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              {dict.notifications.preferences.actionRequired}
            </h4>
            <p className="text-muted-foreground text-sm">
              {dict.notifications.preferences.notificationTypes.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
