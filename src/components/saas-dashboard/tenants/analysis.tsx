// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { Building2, TrendingUp, Users } from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

async function getTenantStats() {
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30))

  // One groupBy returns the plan × active matrix, replacing 7 separate counts.
  // planType is stored with inconsistent casing, so normalize to lowercase here
  // (uppercase string literals would silently match 0 rows).
  const [planGroups, recentSignups, totalStudents, totalTeachers] =
    await Promise.all([
      db.school.groupBy({ by: ["planType", "isActive"], _count: true }),
      db.school.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.student.count(),
      db.teacher.count(),
    ])

  let totalTenants = 0
  let activeTenants = 0
  const planCounts = { trial: 0, basic: 0, premium: 0, enterprise: 0 }
  for (const group of planGroups) {
    const n = group._count
    totalTenants += n
    if (group.isActive) activeTenants += n
    const key = group.planType.toLowerCase()
    if (key in planCounts) planCounts[key as keyof typeof planCounts] += n
  }
  const inactiveTenants = totalTenants - activeTenants

  return {
    totalTenants,
    activeTenants,
    inactiveTenants,
    trialTenants: planCounts.trial,
    basicTenants: planCounts.basic,
    premiumTenants: planCounts.premium,
    enterpriseTenants: planCounts.enterprise,
    totalStudents,
    totalTeachers,
    recentSignups,
    activeRate:
      totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0,
    growthRate:
      totalTenants > 0 ? Math.round((recentSignups / totalTenants) * 100) : 0,
  }
}

export async function TenantsAnalysis({ dictionary, lang }: Props) {
  const t = dictionary?.operator?.tenants
  const stats = await getTenantStats()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.totalSchools || "Total Schools"}
            </CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeTenants} {t?.active || "active"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.activeRate || "Active Rate"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRate}%</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeTenants} {t?.of || "of"} {stats.totalTenants}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.totalStudents || "Total Students"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalStudents.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {t?.acrossAllSchools || "Across all schools"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.totalTeachers || "Total Teachers"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTeachers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {t?.acrossAllSchools || "Across all schools"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.growthRate || "Growth Rate"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.growthRate}%</div>
            <p className="text-muted-foreground text-xs">
              {stats.recentSignups} {t?.newThisMonth || "new this month"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.trial || "Trial"}
            </CardTitle>
            <Badge variant="secondary">Free</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialTenants}</div>
            <p className="text-muted-foreground text-xs">
              {t?.schoolsOnTrial || "Schools on trial"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.basic || "Basic"}
            </CardTitle>
            <Badge variant="default">$99/mo</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.basicTenants}</div>
            <p className="text-muted-foreground text-xs">
              {t?.basicPlanSchools || "Basic plan schools"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.premium || "Premium"}
            </CardTitle>
            <Badge variant="default">$299/mo</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.premiumTenants}</div>
            <p className="text-muted-foreground text-xs">
              {t?.premiumPlanSchools || "Premium plan schools"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.enterprise || "Enterprise"}
            </CardTitle>
            <Badge variant="default">Custom</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enterpriseTenants}</div>
            <p className="text-muted-foreground text-xs">
              {t?.enterpriseSchools || "Enterprise schools"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Expiration Alert */}
      {stats.trialTenants > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t?.trialManagement || "Trial Management"}
            </CardTitle>
            <CardDescription>
              {stats.trialTenants}{" "}
              {t?.trialManagementDescription
                ? t.trialManagementDescription.replace(
                    "{count}",
                    String(stats.trialTenants)
                  )
                : "schools are currently on trial plans"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                {t?.monitorTrials ||
                  "Monitor trial expirations and convert schools to paid plans:"}
              </p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                <li>
                  {t?.expiringTrials ||
                    "Schools with expiring trials need follow-up"}
                </li>
                <li>
                  {t?.upgradeIncentives ||
                    "Offer upgrade incentives before trial ends"}
                </li>
                <li>
                  {t?.trackConversion ||
                    "Track conversion rates from trial to paid"}
                </li>
              </ul>
              <div className="pt-2">
                <Link href={`/${lang}/tenants?plan=TRIAL`}>
                  <Button variant="outline" size="sm">
                    {t?.viewTrialSchools || "View Trial Schools"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
