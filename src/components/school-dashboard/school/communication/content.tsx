import Link from "next/link"
import { Bell, Mail, Megaphone, Send } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function CommunicationContent({
  dictionary,
  lang,
}: Props) {
  const { schoolId } = await getTenantContext()

  let totalAnnouncements = 0
  let activeAnnouncements = 0
  let totalTemplates = 0
  let sentThisMonth = 0
  let recentBatches: {
    id: string
    title: string
    status: string
    sentCount: number
    totalCount: number
    createdAt: Date
  }[] = []

  if (schoolId) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    try {
      ;[
        totalAnnouncements,
        activeAnnouncements,
        totalTemplates,
        sentThisMonth,
        recentBatches,
      ] = await Promise.all([
        db.announcement.count({ where: { schoolId } }).catch(() => 0),
        db.announcement
          .count({ where: { schoolId, published: true } })
          .catch(() => 0),
        db.notificationTemplate.count({ where: { schoolId } }).catch(() => 0),
        db.notification
          .count({
            where: { schoolId, createdAt: { gte: startOfMonth } },
          })
          .catch(() => 0),
        db.notificationBatch
          .findMany({
            where: { schoolId },
            select: {
              id: true,
              title: true,
              status: true,
              sentCount: true,
              totalCount: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
          .catch(() => []),
      ])
    } catch (error) {
      console.error("Error fetching communication data:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Communication Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Announcements
            </CardTitle>
            <Megaphone className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnnouncements}</div>
            <p className="text-muted-foreground text-xs">
              {activeAnnouncements} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Email Templates
            </CardTitle>
            <Mail className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTemplates}</div>
            <p className="text-muted-foreground text-xs">
              Configured templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notifications Sent
            </CardTitle>
            <Send className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sentThisMonth.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Broadcasts
            </CardTitle>
            <Bell className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentBatches.length}</div>
            <p className="text-muted-foreground text-xs">Last 5 batches</p>
          </CardContent>
        </Card>
      </div>

      {/* Communication Tools */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Templates */}
        <Card className="border-blue-500/20 transition-colors hover:border-blue-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Customizable notification templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Design and manage notification templates for various system
              events.
            </p>
            <Button asChild>
              <Link href={`/${lang}/school/communication/templates`}>
                Manage Templates
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Broadcast Messages */}
        <Card className="border-green-500/20 transition-colors hover:border-green-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-500" />
              Broadcast Messages
            </CardTitle>
            <CardDescription>Mass messaging by role or class</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Send bulk notifications to specific user groups.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/school/communication/broadcast`}>
                Send Broadcast
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-purple-500/20 transition-colors hover:border-purple-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure delivery preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Set up notification preferences, quiet hours, and digest settings.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/school/communication/settings`}>
                Configure Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Batches */}
      {recentBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Broadcast Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{batch.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(batch.createdAt).toLocaleDateString()} &middot;{" "}
                      {batch.sentCount}/{batch.totalCount} sent
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      batch.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : batch.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
