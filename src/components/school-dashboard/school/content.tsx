// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  AlertCircle,
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

import { fill, formatConsoleNumber } from "./format"

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

  const t = dictionary.schoolConsole.overview
  const num = (v: number, opts?: Intl.NumberFormatOptions) =>
    formatConsoleNumber(v, lang, opts)

  const stats = [
    {
      label: t.stats.users,
      value: totalUsers,
      sub: fill(t.stats.verifiedCount, { count: num(activeUsers) }),
    },
    {
      label: t.stats.teachers,
      value: totalTeachers,
      sub: t.stats.teachersSub,
    },
    {
      label: t.stats.students,
      value: totalStudents,
      sub: t.stats.studentsSub,
    },
    {
      label: t.stats.departments,
      value: totalDepartments,
      sub: t.stats.departmentsSub,
    },
  ]

  const modules = [
    {
      title: t.modules.configuration.title,
      description: t.modules.configuration.description,
      href: `/${lang}/school/configuration/title`,
      icon: Settings,
    },
    {
      title: t.modules.membership.title,
      description: t.modules.membership.description,
      href: `/${lang}/school/membership`,
      icon: UserCog,
    },
    {
      title: t.modules.communication.title,
      description: t.modules.communication.description,
      href: `/${lang}/school/communication`,
      icon: Bell,
    },
    {
      title: t.modules.security.title,
      description: t.modules.security.description,
      href: `/${lang}/school/security`,
      icon: Shield,
    },
    {
      title: t.modules.reports.title,
      description: t.modules.reports.description,
      href: `/${lang}/school/reports`,
      icon: FileText,
    },
    {
      title: t.modules.bulk.title,
      description: t.modules.bulk.description,
      href: `/${lang}/school/bulk`,
      icon: Upload,
    },
  ]

  const services = [
    { name: t.systemStatus.api, icon: Server },
    { name: t.systemStatus.database, icon: Database },
    { name: t.systemStatus.storage, icon: Cloud },
    { name: t.systemStatus.email, icon: Mail },
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
      label: t.stats.teachers,
    },
    {
      value: totalStudents,
      color: "bg-[#CBCADB]",
      dot: "bg-[#CBCADB]",
      label: t.stats.students,
    },
    {
      value: totalDepartments,
      color: "bg-[#BCD1CA]",
      dot: "bg-[#BCD1CA]",
      label: t.stats.departments,
    },
    {
      value: totalClassrooms,
      color: "bg-amber-500",
      dot: "bg-amber-500",
      label: t.stats.classrooms,
    },
    {
      value: activeUsers,
      color: "bg-rose-400",
      dot: "bg-rose-400",
      label: t.stats.verified,
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
              <p className="text-muted-foreground text-xs tracking-wide uppercase rtl:tracking-normal">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">
                {num(stat.value)}
              </p>
              <p className="text-muted-foreground mt-2 text-xs">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============================================================== */}
      {/* SECTION 2 — Organization snapshot                              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 gap-5">
        {/* --- Organization Snapshot ---------------------------------- */}
        <Card className={glass}>
          <CardHeader className="px-6 pt-5 pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {t.organization.title}
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  {fill(t.organization.caption, { total: num(orgTotal) })}
                </p>
              </div>
              {pendingApprovals > 0 && (
                <Link
                  href={`/${lang}/school/membership`}
                  className="group"
                  aria-label={t.organization.attentionLink}
                >
                  <Badge
                    variant="secondary"
                    className="gap-1.5 bg-amber-500/10 text-xs text-amber-600 transition-colors group-hover:bg-amber-500/20"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fill(
                      pendingApprovals === 1
                        ? t.organization.attentionOne
                        : t.organization.attentionMany,
                      { count: num(pendingApprovals) }
                    )}
                    <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                  </Badge>
                </Link>
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
                    className="grid grid-cols-[minmax(7rem,10rem)_1fr_3rem] items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {seg.label}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {fill(t.organization.barCaption, {
                          value: num(seg.value),
                          total: num(orgTotal),
                          percent: num(pct / 100, {
                            style: "percent",
                            maximumFractionDigits: 0,
                          }),
                        })}
                      </p>
                    </div>
                    <div className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className={cn("h-full rounded-full", seg.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-end text-sm font-semibold tabular-nums">
                      {num(seg.value)}
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
            <CardTitle className="text-base">{t.workflow.title}</CardTitle>
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
                {t.systemStatus.title}
              </CardTitle>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t.systemStatus.operational}
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
