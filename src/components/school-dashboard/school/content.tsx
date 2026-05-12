// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Cloud,
  Database,
  FileText,
  Mail,
  Server,
  Settings,
  Shield,
  Upload,
  UserCog,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

// Glassmorphism card base
const glass =
  "rounded-2xl border-white/10 bg-card/60 shadow-sm backdrop-blur-xl dark:border-white/[0.06] dark:bg-card/40"

export default async function AdminContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  let totalUsers = 0
  let activeUsers = 0
  let totalTeachers = 0
  let totalStudents = 0
  let totalDepartments = 0
  let totalClassrooms = 0
  let pendingApprovals = 0

  if (schoolId) {
    try {
      ;[
        totalUsers,
        activeUsers,
        totalTeachers,
        totalStudents,
        totalDepartments,
        totalClassrooms,
        pendingApprovals,
      ] = await Promise.all([
        db.user.count({ where: { schoolId } }).catch(() => 0),
        db.user
          .count({
            where: {
              schoolId,
              emailVerified: { not: null },
            },
          })
          .catch(() => 0),
        db.teacher.count({ where: { schoolId } }).catch(() => 0),
        db.student.count({ where: { schoolId } }).catch(() => 0),
        db.department.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        db.user
          .count({
            where: {
              schoolId,
              emailVerified: null,
            },
          })
          .catch(() => 0),
      ])
    } catch (error) {
      console.error("Error fetching admin data:", error)
    }
  }

  const d = dictionary?.admin

  const stats = [
    {
      label: d?.stats?.users || "Users",
      value: totalUsers,
      sub: `${activeUsers} ${d?.stats?.activeInLast30Days || "verified"}`,
    },
    {
      label: d?.stats?.teachers || "Teachers",
      value: totalTeachers,
      sub: d?.stats?.activeTeachers || "Active teachers",
    },
    {
      label: d?.stats?.students || "Students",
      value: totalStudents,
      sub: d?.stats?.enrolledStudents || "Enrolled students",
    },
    {
      label: d?.stats?.departments || "Departments",
      value: totalDepartments,
      sub: d?.stats?.activeDepartments || "Active departments",
    },
  ]

  const modules = [
    {
      title: d?.cards?.configuration?.viewSettings || "Configuration",
      description:
        d?.cards?.configuration?.details ||
        "School profile, academic years, departments, and grading",
      href: `/${lang}/school/configuration/title`,
      icon: Settings,
    },
    {
      title: d?.quickActions?.addUser || "Membership",
      description:
        d?.quickActions?.addUserDesc ||
        "Users, roles, invitations, and accounts",
      href: `/${lang}/school/membership`,
      icon: UserCog,
    },
    {
      title: d?.quickActions?.announce || "Communication",
      description:
        d?.quickActions?.announceDesc ||
        "Announcements, notifications, and messaging",
      href: `/${lang}/school/communication`,
      icon: Bell,
    },
    {
      title: d?.quickActions?.viewLogs || "Security",
      description:
        d?.quickActions?.viewLogsDesc ||
        "Audit logs, sessions, and access control",
      href: `/${lang}/school/security`,
      icon: Shield,
    },
    {
      title: d?.quickActions?.exportData || "Reports",
      description:
        d?.quickActions?.exportDataDesc ||
        "Analytics, exports, and data insights",
      href: `/${lang}/school/reports`,
      icon: FileText,
    },
    {
      title: d?.cards?.configuration?.schoolProfile || "Bulk Operations",
      description:
        d?.quickActions?.bulkDesc ||
        "Import, export, and batch process school data",
      href: `/${lang}/school/bulk`,
      icon: Upload,
    },
  ]

  const services = [
    { name: d?.systemStatus?.api || "API Services", icon: Server },
    { name: d?.systemStatus?.database || "Database", icon: Database },
    { name: d?.systemStatus?.storage || "Storage", icon: Cloud },
    { name: d?.systemStatus?.email || "Email Service", icon: Mail },
  ]

  // Proportional bar segments for organization composition
  const orgTotal =
    totalTeachers +
    totalStudents +
    totalDepartments +
    totalClassrooms +
    activeUsers
  const barSegments = [
    {
      value: totalTeachers,
      color: "bg-[#6A9BCC]",
      dot: "bg-[#6A9BCC]",
      label: d?.stats?.teachers || "Teachers",
    },
    {
      value: totalStudents,
      color: "bg-[#CBCADB]",
      dot: "bg-[#CBCADB]",
      label: d?.stats?.students || "Students",
    },
    {
      value: totalDepartments,
      color: "bg-[#BCD1CA]",
      dot: "bg-[#BCD1CA]",
      label: d?.stats?.departments || "Departments",
    },
    {
      value: totalClassrooms,
      color: "bg-amber-500",
      dot: "bg-amber-500",
      label: d?.stats?.totalClassrooms || "Classrooms",
    },
    {
      value: activeUsers,
      color: "bg-rose-400",
      dot: "bg-rose-400",
      label: d?.stats?.currentlyLoggedIn || "Verified",
    },
  ]

  return (
    <div className="min-h-full space-y-5">
      {/* ============================================================== */}
      {/* SECTION 1 — Stat cards: 4 in a row                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={glass}>
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-2 text-xs">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============================================================== */}
      {/* SECTION 2 — Operation CTA + Organization snapshot              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* --- Operation / View Settings CTA -------------------------- */}
        <Card className="overflow-hidden rounded-2xl border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg dark:from-emerald-600 dark:to-teal-700">
          <CardContent className="p-6">
            <p className="text-xs font-medium tracking-wider text-white/70 uppercase">
              {d?.stats?.operation || "Operation"}
            </p>
            <p className="mt-2 text-lg leading-tight font-bold">
              {d?.cards?.configuration?.viewSettings || "View Settings"}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/80">
              {d?.cards?.configuration?.details ||
                "Manage school profile, academic years, and settings."}
            </p>
            <Link
              href={`/${lang}/school/configuration/title`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              {d?.actions?.configure || "Configure"}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>

        {/* --- Organization Snapshot ---------------------------------- */}
        <Card className={cn(glass, "lg:col-span-2")}>
          <CardHeader className="px-6 pt-5 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {d?.stats?.organization || "Organization"}
              </CardTitle>
              {pendingApprovals > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-amber-500/10 text-xs text-amber-600"
                >
                  {pendingApprovals} {d?.stats?.requiresAttention || "pending"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {/* Row breakdown — label, inline mini bar, count */}
            <div className="divide-border/40 divide-y">
              {barSegments.map((seg) => {
                const pct = orgTotal > 0 ? (seg.value / orgTotal) * 100 : 0
                return (
                  <div
                    key={seg.label}
                    className="grid grid-cols-[7rem_1fr_3rem] items-center gap-4 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-muted-foreground truncate text-xs">
                      {seg.label}
                    </span>
                    <div className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className={cn("h-full rounded-full", seg.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-end text-sm font-semibold tabular-nums">
                      {seg.value}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* SECTION 3 — Admin Workflow Guide + System Status, 50/50        */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* --- Admin Workflow Guide (module navigation) --------------- */}
        <Card className={cn(glass, "overflow-hidden")}>
          <CardHeader className="px-6 pt-5 pb-3">
            <CardTitle className="text-base">
              {d?.workflow?.title || "Admin Workflow Guide"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-border/50 divide-y">
              {modules.map((mod) => {
                const Icon = mod.icon
                return (
                  <Link key={mod.href} href={mod.href} className="group block">
                    <div className="hover:bg-accent/30 flex items-center gap-4 px-6 py-4 transition-colors">
                      <div
                        className={cn(
                          "bg-muted/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                        )}
                      >
                        <Icon className="text-foreground h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{mod.title}</p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs leading-relaxed">
                          {mod.description}
                        </p>
                      </div>
                      <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* --- System Status ------------------------------------------ */}
        <Card className={glass}>
          <CardHeader className="px-6 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {d?.systemStatus?.title || "System Status"}
              </CardTitle>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {d?.systemStatus?.operational || "Operational"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="divide-border/50 divide-y">
              {services.map((service) => {
                const Icon = service.icon
                return (
                  <div
                    key={service.name}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="bg-muted/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <Icon className="text-foreground h-[18px] w-[18px]" />
                    </div>
                    <span className="text-sm font-medium">{service.name}</span>
                    <CheckCircle2 className="ms-auto h-4 w-4 text-emerald-500" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
