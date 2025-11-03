import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { redirect } from "next/navigation"
import { getUserNotificationPreferences } from "./queries"
import { NotificationPreferencesForm } from "./preferences-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

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
        <h1 className="text-foreground">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Preferences Form */}
      <NotificationPreferencesForm initialPreferences={preferences} />

      {/* Help Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>About Notification Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-1">Notification Channels</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>In-App:</strong> Notifications appear in the notification bell icon</li>
              <li><strong>Email:</strong> Notifications sent to your registered email address</li>
              <li><strong>Push:</strong> Browser push notifications (requires permission)</li>
              <li><strong>SMS:</strong> Text messages to your registered phone number</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-1">Quiet Hours</h4>
            <p>
              During quiet hours, notifications will not be sent except for urgent priority notifications.
              Notifications will be queued and delivered after quiet hours end.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-1">Notification Digest</h4>
            <p>
              Instead of receiving individual email notifications, you can opt for a daily or weekly digest
              that summarizes all your notifications in a single email.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-1">Action Required</h4>
            <p>
              Some notification types are marked as "Action Required" - these are important notifications
              that typically need your response (e.g., assignment submissions, fee payments).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
