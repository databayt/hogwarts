// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ReportIssue } from "@/components/report-issue"
import { ConfigSidebar } from "@/components/school-dashboard/school/configuration/config-sidebar"
import { getDisplayText } from "@/components/translation/display"
import { detectLanguage } from "@/components/translation/util"

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
    discountCount,
    pendingDomainRequest,
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
  ])

  const SECTION_KEYS = [
    "title",
    "description",
    "location",
    "capacity",
    "schedule",
    "branding",
    "hero",
    "name-format",
    "join",
    "visibility",
    "modules",
    "price",
    "discount",
    "legal",
    "plan",
    "domain",
  ] as const

  // Build dynamic descriptions from live data using dictionary strings
  // Async to support on-demand translation for user-facing content

  async function getDynamicDescription(key: string): Promise<string | null> {
    if (!school) return null

    const cs = d as Record<string, unknown> | undefined
    const types = (cs?.types as Record<string, string>) ?? {}
    const levels = (cs?.levels as Record<string, string>) ?? {}
    const plans = (cs?.plans as Record<string, string>) ?? {}

    switch (key) {
      case "title": {
        if (lang === "en" && school.nameEn) return school.nameEn
        if (school.name && schoolId && detectLanguage(school.name) !== lang) {
          return getDisplayText(
            school.name,
            detectLanguage(school.name),
            lang,
            schoolId
          )
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
        if (
          schoolId &&
          parts.length > 0 &&
          detectLanguage(locationText) !== lang
        ) {
          const detected = detectLanguage(locationText)
          parts = await Promise.all(
            parts.map((p) =>
              getDisplayText(p as string, detected, lang, schoolId)
            )
          )
        }
        return parts.length > 0 ? parts.join(", ") : null
      }
      case "branding": {
        const logoLabel = (cs?.logo as string) ?? "Logo"
        const parts = [
          school.logoUrl ? logoLabel : null,
          branding?.primaryColor,
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(" · ") : null
      }
      case "hero":
        return branding?.heroImageUrl
          ? ((cs?.heroConfigured as string) ?? "Custom image set")
          : ((cs?.heroDefault as string) ?? "Default image")

      case "plan": {
        if (!school.planType && !school.maxStudents) return null
        const studentsLabel = (cs?.students as string) ?? "students"
        const translatedPlan = school.planType
          ? (plans[school.planType] ?? school.planType)
          : null
        const planParts = [
          translatedPlan,
          school.maxStudents ? `${school.maxStudents} ${studentsLabel}` : null,
        ].filter(Boolean)
        return planParts.join(" · ")
      }
      case "capacity": {
        const studentsLabel = (cs?.students as string) ?? "students"
        const teachersLabel = (cs?.teachers as string) ?? "teachers"
        const capParts = [
          school.maxStudents ? `${school.maxStudents} ${studentsLabel}` : null,
          school.maxTeachers ? `${school.maxTeachers} ${teachersLabel}` : null,
        ].filter(Boolean)
        return capParts.length > 0 ? capParts.join(", ") : null
      }
      case "price": {
        if (!school.tuitionFee) return null
        const priceParts = [
          school.currency,
          Number(school.tuitionFee).toLocaleString(),
          school.paymentSchedule ? `/${school.paymentSchedule}` : null,
        ].filter(Boolean)
        return priceParts.join(" ")
      }
      case "schedule": {
        const yearLabel =
          yearCount === 1
            ? ((cs?.year as string) ?? "year")
            : ((cs?.years as string) ?? "years")
        const termLabel =
          termCount === 1
            ? ((cs?.term as string) ?? "term")
            : ((cs?.terms as string) ?? "terms")
        return `${yearCount} ${yearLabel}, ${termCount} ${termLabel}`
      }
      case "join":
        return branding?.allowSelfEnrollment
          ? ((cs?.selfEnrollment as string) ?? "Self-enrollment with codes")
          : ((cs?.manualEnrollment as string) ?? "Manual enrollment")
      case "visibility":
        return branding?.informationSharing === "full-transparency"
          ? ((cs?.fullTransparency as string) ?? "Full transparency")
          : ((cs?.limitedSharing as string) ?? "Limited sharing")
      case "discount":
        if (discountCount > 0) {
          const discountLabel =
            discountCount === 1
              ? ((cs?.activeDiscount as string) ?? "active discount")
              : ((cs?.activeDiscounts as string) ?? "active discounts")
          return `${discountCount} ${discountLabel}`
        }
        return (cs?.noActiveDiscounts as string) ?? "No active discounts"
      case "legal": {
        if (!school.planType) return null
        const translatedPlan = plans[school.planType] ?? school.planType
        const planWord = (cs?.planWord as string) ?? "plan"
        return `${translatedPlan} ${planWord}`
      }
      case "modules": {
        const em = school.enabledModules as string[] | null
        if (!em)
          return (cs?.allModulesEnabled as string) ?? "All modules enabled"
        const modulesLabel = (cs?.modulesEnabled as string) ?? "modules enabled"
        return `${em.length} ${modulesLabel}`
      }
      case "name-format":
        return school.nameFormat === "full"
          ? ((cs?.fullName as string) ?? "Full Name (single field)")
          : ((cs?.splitName as string) ?? "Split (First + Last)")
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

  return (
    <div className="h-[calc(100vh-15rem)] overflow-hidden">
      <div className="mx-auto h-full max-w-7xl">
        <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-[auto_1fr]">
          <ConfigSidebar lang={lang} sectionLinks={sectionLinks} />
          <div className="lg:overflow-y-auto">
            <div className="flex min-h-full flex-col items-center justify-start py-8">
              <div className="w-full max-w-[400px]">{children}</div>
              <div className="text-muted-foreground w-full max-w-[400px] pt-8 pb-4 text-start text-sm">
                <ReportIssue />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
