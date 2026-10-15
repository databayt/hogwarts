// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
import {
  enumLabel,
  fill,
  formatConsoleDate,
  formatConsoleNumber,
} from "@/components/school-dashboard/school/format"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function CommunicationContent({
  dictionary,
  lang,
}: Props) {
  const { schoolId } = await getTenantContext()
  const t = dictionary.schoolConsole.communication
  const num = (v: number) => formatConsoleNumber(v, lang)

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
              {t.stats.totalAnnouncements}
            </CardTitle>
            <Megaphone className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(totalAnnouncements)}</div>
            <p className="text-muted-foreground text-xs">
              {fill(t.stats.activeCount, { count: num(activeAnnouncements) })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.stats.emailTemplates}
            </CardTitle>
            <Mail className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(totalTemplates)}</div>
            <p className="text-muted-foreground text-xs">
              {t.stats.configuredTemplates}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.stats.notificationsSent}
            </CardTitle>
            <Send className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(sentThisMonth)}</div>
            <p className="text-muted-foreground text-xs">{t.stats.thisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.stats.recentBroadcasts}
            </CardTitle>
            <Bell className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {num(recentBatches.length)}
            </div>
            <p className="text-muted-foreground text-xs">
              {t.stats.lastBatches}
            </p>
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
              {t.tools.templates.title}
            </CardTitle>
            <CardDescription>{t.tools.templates.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {t.tools.templates.description}
            </p>
            <Button asChild>
              <Link href={`/${lang}/school/communication/templates`}>
                {t.tools.templates.action}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Broadcast Messages */}
        <Card className="border-green-500/20 transition-colors hover:border-green-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-500" />
              {t.tools.broadcast.title}
            </CardTitle>
            <CardDescription>{t.tools.broadcast.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {t.tools.broadcast.description}
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/school/communication/broadcast`}>
                {t.tools.broadcast.action}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-purple-500/20 transition-colors hover:border-purple-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              {t.tools.settings.title}
            </CardTitle>
            <CardDescription>{t.tools.settings.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {t.tools.settings.description}
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/school/communication/settings`}>
                {t.tools.settings.action}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Batches */}
      {recentBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.recentActivity}</CardTitle>
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
                      {formatConsoleDate(batch.createdAt, lang)} &middot;{" "}
                      {fill(t.sentOf, {
                        sent: num(batch.sentCount),
                        total: num(batch.totalCount),
                      })}
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
                    {enumLabel(t.batchStatus, batch.status)}
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
