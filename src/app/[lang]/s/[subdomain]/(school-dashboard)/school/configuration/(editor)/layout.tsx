// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { parseEnabledModules } from "@/lib/enabled-modules"
import { normalizePlanType } from "@/lib/plan-type"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ReportIssue } from "@/components/report-issue"
import { BreadcrumbTitle } from "@/components/saas-dashboard/breadcrumb-title"
import { formatMoney } from "@/components/school-dashboard/finance/lib/format-money"
import { ConfigSidebar } from "@/components/school-dashboard/school/configuration/config-sidebar"
import {
  joinList,
  plural,
} from "@/components/school-dashboard/school/configuration/ui/format"
import { TIMETABLE_STRUCTURES } from "@/components/school-dashboard/timetable/structures"
import { getText } from "@/components/translation/display"
import { detectLang } from "@/components/translation/util"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function EditorLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.schoolAdmin?.configSections as
    | Record<string, unknown>
    | undefined

  const { schoolId } = await getTenantContext()

  // Fetch school data for dynamic descriptions
  const [
    school,
    branding,
    yearCount,
    termCount,
    levelCount,
    gradeCount,
    discountCount,
    pendingDomainRequest,
    upcomingHolidays,
  ] = await Promise.all([
    schoolId
      ? db.school
          .findUnique({
            where: { id: schoolId },
            select: {
              name: true,
              nameEn: true,
              preferredLanguage: true,
              nameFormat: true,
              nameDisplay: true,
              teacherNameContact: true,
              studentNameContact: true,
              guardianNameContact: true,
              staffNameContact: true,
              memberNameContact: true,
              schoolType: true,
              schoolLevel: true,
              city: true,
              state: true,
              country: true,
              domain: true,
              logoUrl: true,
              planType: true,
              maxStudents: true,
              maxTeachers: true,
              tuitionFee: true,
              currency: true,
              paymentSchedule: true,
              enabledModules: true,
              conferenceDeliveryMode: true,
              timetableStructure: true,
            },
          })
          .catch(() => null)
      : null,
    schoolId
      ? db.schoolBranding
          .findUnique({
            where: { schoolId },
            select: {
              primaryColor: true,
              heroImageUrl: true,
              isPubliclyListed: true,
              allowSelfEnrollment: true,
              informationSharing: true,
            },
          })
          .catch(() => null)
      : null,
    schoolId ? db.schoolYear.count({ where: { schoolId } }).catch(() => 0) : 0,
    schoolId ? db.term.count({ where: { schoolId } }).catch(() => 0) : 0,
    schoolId ? db.yearLevel.count({ where: { schoolId } }).catch(() => 0) : 0,
    schoolId ? db.scoreRange.count({ where: { schoolId } }).catch(() => 0) : 0,
    schoolId
      ? db.discount
          .count({ where: { schoolId, isActive: true } })
          .catch(() => 0)
      : 0,
    schoolId
      ? db.domainRequest
          .findFirst({
            where: { schoolId, status: { in: ["pending", "approved"] } },
            select: { domain: true, status: true },
            orderBy: { createdAt: "desc" },
          })
          .catch(() => null)
      : null,
    schoolId
      ? db.scheduleException
          .count({
            where: {
              schoolId,
              exceptionType: { in: ["HOLIDAY", "CANCELLED"] },
              endDate: { gte: new Date() },
            },
          })
          .catch(() => 0)
      : 0,
  ])

  // One card per section, in the order a new admin fills things in.
  const SECTION_KEYS = [
    "title",
    "description",
    "location",
    "capacity",
    "schedule",
    "academic",
    "teaching-mode",
    "live-classes",
    "holidays",
    "branding",
    "hero",
    "name-format",
    "name-display",
    "name-contact",
    "join",
    "visibility",
    "modules",
    "price",
    "discount",
    "legal",
    "plan",
    "domain",
  ] as const

  const sc = dictionary?.schoolConfig as Record<string, any> | undefined
  const counts = (sc?.counts ?? {}) as Record<string, Record<string, string>>
  const count = (key: string, n: number) => plural(counts[key], n, lang)

  async function getDynamicDescription(key: string): Promise<string | null> {
    if (!school) return null

    const cs = d as Record<string, unknown> | undefined
    const types = (cs?.types as Record<string, string>) ?? {}
    const levels = (cs?.levels as Record<string, string>) ?? {}
    const plans = (cs?.plans as Record<string, string>) ?? {}

    switch (key) {
      case "title": {
        if (lang === "en" && school.nameEn) return school.nameEn
        if (school.name && schoolId && detectLang(school.name) !== lang) {
          return getText(school.name, detectLang(school.name), lang, schoolId)
        }
        return school.name || null
      }
      case "description": {
        const translatedType = school.schoolType
          ? (types[school.schoolType] ?? school.schoolType)
          : null
        const translatedLevel = school.schoolLevel
          ? (levels[school.schoolLevel] ?? school.schoolLevel)
          : null
        const parts = [translatedType, translatedLevel].filter(Boolean)
        return parts.length > 0 ? parts.join(" · ") : null
      }
      case "location": {
        let parts = [school.city, school.state, school.country].filter(Boolean)
        const locationText = parts.join(" ")
        if (schoolId && parts.length > 0 && detectLang(locationText) !== lang) {
          const detected = detectLang(locationText)
          parts = await Promise.all(
            parts.map((p) => getText(p as string, detected, lang, schoolId))
          )
        }
        // ISO country codes ("SD") read as a name in the page language.
        if (school.country && /^[A-Z]{2}$/.test(school.country)) {
          try {
            const names = new Intl.DisplayNames([lang], { type: "region" })
            parts = parts.map((p) =>
              p === school.country ? (names.of(p as string) ?? p) : p
            )
          } catch {}
        }
        return parts.length > 0 ? joinList(parts as string[], lang) : null
      }
      case "branding": {
        const parts = [
          school.logoUrl ? (sc?.logo ?? "Logo") : null,
          branding?.primaryColor ? (sc?.colour ?? "Brand colour") : null,
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(" · ") : null
      }
      case "hero":
        return branding?.heroImageUrl
          ? (sc?.heroCustom ?? "Custom image")
          : (sc?.heroDefault ?? "Default image")

      case "plan": {
        const planId = normalizePlanType(school.planType)
        const planParts = [
          plans[planId] ?? planId,
          school.maxStudents ? count("student", school.maxStudents) : null,
        ].filter(Boolean)
        return planParts.join(" · ")
      }
      case "capacity": {
        const capParts = [
          school.maxStudents ? count("student", school.maxStudents) : null,
          school.maxTeachers ? count("teacher", school.maxTeachers) : null,
        ].filter(Boolean) as string[]
        return capParts.length > 0 ? joinList(capParts, lang) : null
      }
      case "price": {
        if (!school.tuitionFee) return null
        const period: Record<string, string | undefined> = {
          annual: sc?.perYear,
          termly: sc?.perTerm,
          monthly: sc?.perMonth,
        }
        return [
          formatMoney(
            Number(school.tuitionFee),
            school.currency || "USD",
            lang
          ),
          period[school.paymentSchedule ?? ""] ?? null,
        ]
          .filter(Boolean)
          .join(" ")
      }
      case "schedule": {
        const structure = TIMETABLE_STRUCTURES.find(
          (s) => s.slug === school.timetableStructure
        )
        if (!structure) return null
        return lang === "ar"
          ? structure.name
          : (structure.nameEn ?? structure.name)
      }
      case "academic":
        return [
          count("year", yearCount),
          count("term", termCount),
          count("level", levelCount),
          count("grade", gradeCount),
        ].join(" · ")
      case "join":
        return branding?.allowSelfEnrollment
          ? ((cs?.selfEnrollment as string) ?? "Self-enrollment with codes")
          : ((cs?.manualEnrollment as string) ?? "Manual enrollment")
      case "visibility":
        return branding?.informationSharing === "full-transparency"
          ? ((cs?.fullTransparency as string) ?? "Full transparency")
          : ((cs?.limitedSharing as string) ?? "Limited sharing")
      case "discount":
        return count("discount", discountCount)
      case "holidays":
        return upcomingHolidays > 0
          ? (
              ((cs?.holidays as Record<string, string>)?.upcoming ??
                "{count} upcoming") as string
            ).replace("{count}", String(upcomingHolidays))
          : null
      case "legal": {
        if (!school.planType) return null
        const planId = normalizePlanType(school.planType)
        return lang === "ar"
          ? `${sc?.planSuffix ?? "خطة"} ${plans[planId] ?? planId}`
          : `${plans[planId] ?? planId} ${sc?.planSuffix ?? "plan"}`
      }
      case "modules": {
        const em = parseEnabledModules(school.enabledModules)
        if (!em)
          return (cs?.allModulesEnabled as string) ?? "All modules enabled"
        return count("module", em.length)
      }
      // The mode is the teaching-mode card's line; the live-classes card keeps
      // its static description (what lives behind it), so the list does not
      // say the same word twice.
      case "teaching-mode": {
        const lc = cs?.[key] as Record<string, string> | undefined
        const modes: Record<string, string | undefined> = {
          physical: lc?.physical,
          online: lc?.online,
          hybrid: lc?.hybrid,
        }
        return (
          modes[school.conferenceDeliveryMode] ?? school.conferenceDeliveryMode
        )
      }
      case "name-format":
        return school.nameFormat === "full"
          ? ((cs?.fullName as string) ?? "Full Name (single field)")
          : ((cs?.splitName as string) ?? "Split (First + Last)")
      case "name-display":
        return school.nameDisplay === "first-last"
          ? ((cs?.firstLastName as string) ?? "First + last name")
          : ((cs?.firstSecondName as string) ?? "First + second name")
      case "name-contact": {
        const label = (v: string) =>
          v === "phone"
            ? ((cs?.contactPhone as string) ?? "phone")
            : ((cs?.contactEmail as string) ?? "email")
        return [
          `${(cs?.teachersLabel as string) ?? "Teachers"}: ${label(school.teacherNameContact)}`,
          `${(cs?.studentsLabel as string) ?? "Students"}: ${label(school.studentNameContact)}`,
          `${(cs?.parentsLabel as string) ?? "Parents"}: ${label(school.guardianNameContact)}`,
          `${(cs?.staffLabel as string) ?? "Staff"}: ${label(school.staffNameContact)}`,
          `${(cs?.membersLabel as string) ?? "Members"}: ${label(school.memberNameContact)}`,
        ].join(" · ")
      }
      case "domain": {
        if (pendingDomainRequest) {
          const status =
            pendingDomainRequest.status === "pending"
              ? ((cs?.pending as string) ?? "Pending")
              : ((cs?.active as string) ?? "Active")
          return `${status}: ${pendingDomainRequest.domain}`
        }
        return (cs?.noCustomDomain as string) ?? "No custom domain"
      }
      default:
        return null
    }
  }

  const sectionLinks = await Promise.all(
    SECTION_KEYS.map(async (key) => {
      const section = d?.[key] as
        | { title: string; description: string }
        | undefined
      const dynamicDesc = await getDynamicDescription(key)
      return {
        key,
        title: section?.title ?? key,
        description: dynamicDesc ?? section?.description ?? "",
      }
    })
  )

  // Breadcrumb segments use the same titles as the list, so the trail reads
  // "الإعدادات › الاسم", never a raw slug or a second, different word.
  const segmentTitles: Record<string, string> = {
    configuration:
      (dictionary?.school?.schoolAdmin?.navigation as any)?.configuration ??
      "Configuration",
  }
  for (const link of sectionLinks) segmentTitles[link.key] = link.title

  return (
    <div className="h-[calc(100vh-15rem)] overflow-hidden">
      <div className="mx-auto h-full max-w-7xl">
        <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-[auto_1fr]">
          <BreadcrumbTitle segments={segmentTitles} />
          <ConfigSidebar
            lang={lang}
            sectionLinks={sectionLinks}
            notSet={sc?.notSet ?? "Not set"}
          />
          <div className="lg:overflow-y-auto">
            {/* Editors are a narrow 400px column by default. A page opts out
                by marking its own root — `data-wide` for the tabbed academic
                UI, `data-full-width` for the live-class settings panel — and
                `:has()` widens the column and the footer together. Reading the
                route from a request header does not work here: nothing in the
                app sets `x-pathname`. */}
            <div className="flex min-h-full flex-col items-start justify-start py-8 [--config-col:560px] has-[[data-full-width]]:[--config-col:100%] has-[[data-wide]]:[--config-col:64rem] lg:ps-6">
              <div className="w-full max-w-[var(--config-col)]">{children}</div>
              <div className="text-muted-foreground w-full max-w-[var(--config-col)] pt-8 pb-4 text-start text-sm">
                <ReportIssue />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
