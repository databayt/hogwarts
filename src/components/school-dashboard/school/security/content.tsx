// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { Activity, FileWarning, Key, Shield, UserX } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  fill,
  formatConsoleNumber,
} from "@/components/school-dashboard/school/format"

import AccessContent from "./access/content"
import AuditContent from "./audit/content"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function SecurityContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const t = dictionary.schoolConsole.security
  const num = (v: number, opts?: Intl.NumberFormatOptions) =>
    formatConsoleNumber(v, lang, opts)

  let failedLogins = 0
  let twoFactorUsers = 0
  let totalUsers = 0
  let auditEventsToday = 0

  if (schoolId) {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      ;[failedLogins, twoFactorUsers, totalUsers, auditEventsToday] =
        await Promise.all([
          db.loginAttempt
            .count({
              where: { schoolId, success: false, timestamp: { gte: last24h } },
            })
            .catch(() => 0),
          db.user
            .count({ where: { schoolId, isTwoFactorEnabled: true } })
            .catch(() => 0),
          db.user.count({ where: { schoolId } }).catch(() => 0),
          db.auditLog
            .count({ where: { schoolId, createdAt: { gte: today } } })
            .catch(() => 0),
        ])
    } catch (error) {
      console.error("Error fetching security data:", error)
    }
  }

  // Calculate security score
  const twoFactorRate = totalUsers > 0 ? (twoFactorUsers / totalUsers) * 100 : 0
  const failureRate =
    failedLogins > 10 ? 0 : Math.max(0, 100 - failedLogins * 10)
  const securityScore = Math.round(
    twoFactorRate * 0.4 +
      failureRate * 0.3 +
      (auditEventsToday > 0 ? 100 : 50) * 0.3
  )

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.auditEventsToday}
            </CardTitle>
            <FileWarning className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(auditEventsToday)}</div>
            <p className="text-muted-foreground text-xs">{t.loggedActions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.failedLogins}
            </CardTitle>
            <UserX className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(failedLogins)}</div>
            <p className="text-muted-foreground text-xs">{t.last24Hours}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.twoFactorEnabled}
            </CardTitle>
            <Key className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(twoFactorUsers)}</div>
            <p className="text-muted-foreground text-xs">
              {totalUsers > 0
                ? fill(t.percentOfUsers, {
                    percent: num(Math.round(twoFactorRate) / 100, {
                      style: "percent",
                    }),
                  })
                : t.noUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.securityScore}
            </CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {num(securityScore / 100, { style: "percent" })}
            </div>
            <p className="text-muted-foreground text-xs">
              {securityScore >= 80
                ? t.scoreGood
                : securityScore >= 50
                  ? t.scoreImprove
                  : t.scoreAction}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">{t.tabs.audit}</TabsTrigger>
          <TabsTrigger value="access">{t.tabs.access}</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-4">
          <Suspense
            fallback={
              <div className="text-muted-foreground py-8 text-center">
                {t.loadingAudit}
              </div>
            }
          >
            <AuditContent lang={lang} />
          </Suspense>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <Suspense
            fallback={
              <div className="text-muted-foreground py-8 text-center">
                {t.loadingAccess}
              </div>
            }
          >
            <AccessContent dictionary={dictionary} lang={lang} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
