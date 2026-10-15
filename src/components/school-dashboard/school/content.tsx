// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  ArrowRight,
  Bell,
  Check,
  FileText,
  Settings,
  Shield,
  Upload,
  UserCog,
  type LucideIcon,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { fill, formatConsoleNumber } from "./format"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

/**
 * The /school overview, drawn in the /live landing's pattern: a green brand
 * hero, then flat bordered bands — the school at a glance, system status —
 * and a grid of real destinations. See `live/landing/` for the reasoning
 * behind each piece; this page reuses the same geometry, ink and type.
 */
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
  const num = (v: number) => formatConsoleNumber(v, lang)

  const stats = [
    {
      label: t.stats.users,
      value: totalUsers,
      sub: fill(t.stats.verifiedCount, { count: num(activeUsers) }),
    },
    { label: t.stats.teachers, value: totalTeachers, sub: t.stats.teachersSub },
    { label: t.stats.students, value: totalStudents, sub: t.stats.studentsSub },
    {
      label: t.stats.departments,
      value: totalDepartments,
      sub: t.stats.departmentsSub,
    },
    { label: t.stats.classrooms, value: totalClassrooms },
  ]

  const modules: Array<{
    key: keyof typeof t.modules
    Icon: LucideIcon
    href: string
  }> = [
    {
      key: "configuration",
      Icon: Settings,
      href: `/${lang}/school/configuration/title`,
    },
    { key: "membership", Icon: UserCog, href: `/${lang}/school/membership` },
    { key: "communication", Icon: Bell, href: `/${lang}/school/communication` },
    { key: "security", Icon: Shield, href: `/${lang}/school/security` },
    { key: "reports", Icon: FileText, href: `/${lang}/school/reports` },
    { key: "bulk", Icon: Upload, href: `/${lang}/school/bulk` },
  ]

  const services = [
    t.systemStatus.api,
    t.systemStatus.database,
    t.systemStatus.storage,
    t.systemStatus.email,
  ]

  return (
    <>
      {/* Hero — the /live banner: brand green, ink pinned dark, two pills. */}
      <section className="mb-8">
        <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-[36px] bg-[#00bc6d] px-8 py-10 text-[#050505] sm:px-12 lg:min-h-[259px] lg:flex-row lg:items-center lg:py-12">
          {/* Derived from `Objects-Puzzle.svg` with its cream fill recoloured
              to the hero mint `#9FE5B1`, so it sits on the green unboxed. */}
          <img
            src="/anthropic/Objects-Puzzle-alpha.svg"
            alt=""
            decoding="async"
            draggable={false}
            aria-hidden="true"
            className="pointer-events-none absolute end-12 hidden size-[170px] object-contain md:block lg:size-[190px]"
          />

          <div className="relative min-w-0">
            <h1
              className="max-w-[16ch] text-3xl leading-[1.35] font-light text-balance sm:text-4xl lg:max-w-[420px] lg:text-[38px]"
              style={{ fontFamily: '"thmanyah sans", sans-serif' }}
            >
              <MarkedHeadline template={t.hero.title} mark={t.hero.titleMark} />
            </h1>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Link className={pill("default")} href={modules[0].href}>
                {t.modules.configuration.title}
              </Link>
              <Link className={pill("ghost")} href={modules[1].href}>
                {t.modules.membership.title}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* At a glance — the readiness band's shape, carrying the counts. */}
      <section className="mb-16">
        <div className="mb-5">
          <h2 className={typographyVariants.cardTitle}>{t.glance.title}</h2>
          <p className={cn(typographyVariants.hint, "mt-1 max-w-[64ch]")}>
            {t.glance.description}
          </p>
        </div>

        <ul className="divide-border grid grid-cols-1 divide-y rounded-xl border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
          {stats.map((stat) => (
            <li key={stat.label} className="p-4 text-start">
              <span className={typographyVariants.hint}>{stat.label}</span>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {num(stat.value)}
              </p>
              {stat.sub ? (
                <p className="text-muted-foreground mt-1 text-xs">{stat.sub}</p>
              ) : null}
            </li>
          ))}
        </ul>

        {pendingApprovals > 0 ? (
          <Link
            href={`/${lang}/school/membership`}
            aria-label={t.organization.attentionLink}
            className="text-muted-foreground hover:text-foreground group mt-3 inline-flex items-center gap-1.5 text-xs transition-colors"
          >
            {fill(
              pendingApprovals === 1
                ? t.organization.attentionOne
                : t.organization.attentionMany,
              { count: num(pendingApprovals) }
            )}
            <ArrowRight
              className="size-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </section>

      {/* System status — same band, one state dot per service. */}
      <section className="mb-16">
        <h2 className={cn(typographyVariants.cardTitle, "mb-5")}>
          {t.systemStatus.title}
        </h2>

        <ul className="divide-border grid grid-cols-1 divide-y rounded-xl border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {services.map((name) => (
            <li key={name} className="p-4 text-start">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--chart-2)]/15 text-[var(--chart-2)]">
                  <Check
                    className="size-2.5"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                </span>
                <span className={typographyVariants.hint}>{name}</span>
              </div>
              <span className="text-sm font-medium">
                {t.systemStatus.operational}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* What you can do here — the role guide's cards, one per module. */}
      <section className="mb-16">
        <h2 className={cn(typographyVariants.cardTitle, "mb-5")}>
          {t.guide.title}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ key, Icon, href }) => (
            <Link
              key={key}
              href={href}
              className="hover:border-foreground group rounded-xl border p-5 text-start transition-colors"
            >
              <Icon
                className="text-foreground mb-4 size-6"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h3 className="mb-1.5 text-sm font-semibold">
                {t.modules[key].title}
              </h3>
              <p className={typographyVariants.hint}>
                {t.modules[key].description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

/** The headline with its `{mark}` phrase in bold — as on /live. */
function MarkedHeadline({
  template,
  mark,
}: {
  template?: string
  mark?: string
}) {
  if (!template) return null
  const [before, after] = template.split("{mark}")
  if (after === undefined || !mark) return <>{template}</>
  return (
    <>
      {before}
      <strong className="font-bold">{mark}</strong>
      {after}
    </>
  )
}

/** The /live hero pill: pinned colours, because the ground does not invert. */
function pill(variant: "default" | "ghost") {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5",
    "text-sm font-medium whitespace-nowrap transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-[#050505]/40",
    variant === "default"
      ? "bg-white text-[#050505] hover:bg-white/90"
      : "text-[#050505]/75 hover:bg-[#050505]/10 hover:text-[#050505]"
  )
}
