// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building,
  CheckCircle2,
  Cloud,
  Database,
  FileText,
  GraduationCap,
  Mail,
  School,
  Server,
  Settings,
  Shield,
  Upload,
  UserCog,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
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

  // Stat card config with colors matching the dashboard Quick Look palette
  const stats = [
    {
      label: d?.stats?.users || "Users",
      value: totalUsers,
      sub: `${activeUsers} ${d?.stats?.activeInLast30Days || "verified"}`,
      icon: Users,
      color: "text-[#D97757]",
      bg: "bg-[#D97757]/10",
    },
    {
      label: d?.stats?.teachers || "Teachers",
      value: totalTeachers,
      sub: d?.stats?.activeTeachers || "Active teachers",
      icon: GraduationCap,
      color: "text-[#6A9BCC]",
      bg: "bg-[#6A9BCC]/10",
    },
    {
      label: d?.stats?.students || "Students",
      value: totalStudents,
      sub: d?.stats?.enrolledStudents || "Enrolled students",
      icon: School,
      color: "text-[#CBCADB]",
      bg: "bg-[#CBCADB]/10",
    },
    {
      label: d?.stats?.departments || "Departments",
      value: totalDepartments,
      sub: d?.stats?.activeDepartments || "Active departments",
      icon: Building,
      color: "text-[#BCD1CA]",
      bg: "bg-[#BCD1CA]/10",
    },
  ]

  // Navigation modules — the main entry points into school management
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
        d?.quickActions?.addUserDesc || "Users, roles, invitations, and accounts",
      href: `/${lang}/school/membership`,
      icon: UserCog,
    },
    {
      title: d?.quickActions?.announce || "Communication",
      description:
        d?.quickActions?.announceDesc || "Announcements, notifications, and messaging",
      href: `/${lang}/school/communication`,
      icon: Bell,
    },
    {
      title: d?.quickActions?.viewLogs || "Security",
      description:
        d?.quickActions?.viewLogsDesc || "Audit logs, sessions, and access control",
      href: `/${lang}/school/security`,
      icon: Shield,
    },
    {
      title: d?.quickActions?.exportData || "Reports",
      description:
        d?.quickActions?.exportDataDesc || "Analytics, exports, and data insights",
      href: `/${lang}/school/reports`,
      icon: FileText,
    },
    {
      title: d?.cards?.configuration?.schoolProfile || "Bulk Operations",
      description: "Import, export, and batch process school data",
      href: `/${lang}/school/bulk`,
      icon: Upload,
    },
  ]

  // System services status
  const services = [
    {
      name: d?.systemStatus?.api || "API Services",
      icon: Server,
    },
    {
      name: d?.systemStatus?.database || "Database",
      icon: Database,
    },
    {
      name: d?.systemStatus?.storage || "Storage",
      icon: Cloud,
    },
    {
      name: d?.systemStatus?.email || "Email Service",
      icon: Mail,
    },
  ]

  return (
    <div className="space-y-10">
      {/* ------------------------------------------------------------------ */}
      {/* Section 1: At-a-glance stats                                       */}
      {/* Horizontal cards with colored icon badges — same palette as        */}
      {/* the dashboard Quick Look section for visual consistency.            */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-none shadow-none bg-muted/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        stat.bg
                      )}
                    >
                      <Icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">{stat.label}</p>
                      <p className="text-2xl font-semibold tracking-tight">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">{stat.sub}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Organization snapshot                                    */}
      {/* Two side-by-side cards with key operational numbers.                */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-none bg-muted/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  {totalClassrooms}
                </p>
                <p className="text-muted-foreground text-xs">
                  {d?.stats?.totalClassrooms || "Classrooms"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-muted/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                <Users className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  {activeUsers}
                </p>
                <p className="text-muted-foreground text-xs">
                  {d?.stats?.currentlyLoggedIn || "Verified accounts"}
                </p>
              </div>
            </CardContent>
          </Card>

          {pendingApprovals > 0 ? (
            <Card className="border-none shadow-none bg-amber-500/5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <UserCog className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold tracking-tight">
                      {pendingApprovals}
                    </p>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 text-[10px]">
                      {d?.stats?.requiresAttention || "Needs attention"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {d?.stats?.pendingActions || "Pending approvals"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-none bg-muted/50">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight">0</p>
                  <p className="text-muted-foreground text-xs">
                    {d?.stats?.pendingActions || "Pending approvals"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Module navigation                                       */}
      {/* Cards with hover effect linking to each school management area.     */}
      {/* Inspired by Apple Settings / Airbnb category cards.                */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          {d?.workflow?.title || "Manage"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <Link key={mod.href} href={mod.href} className="group">
                <Card className="h-full border-none shadow-none bg-muted/50 transition-colors group-hover:bg-muted">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm">
                      <Icon className="text-foreground h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{mod.title}</p>
                        <ArrowRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: System status                                           */}
      {/* Compact horizontal status bar — all green = minimal footprint.     */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <Card className="border-none shadow-none bg-muted/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">
                {d?.systemStatus?.title || "System Status"}
              </h3>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {d?.systemStatus?.operational || "All systems operational"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {services.map((service) => {
                const Icon = service.icon
                return (
                  <div
                    key={service.name}
                    className="bg-background flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  >
                    <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="text-sm truncate">{service.name}</span>
                    <CheckCircle2 className="ms-auto h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
