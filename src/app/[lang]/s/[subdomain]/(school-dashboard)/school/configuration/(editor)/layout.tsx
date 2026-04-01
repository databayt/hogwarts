// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigSidebar } from "@/components/school-dashboard/school/configuration/config-sidebar"

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

  // Build dynamic descriptions from live data
  function getDynamicDescription(key: string): string | null {
    if (!school) return null

    switch (key) {
      case "title":
        return school.name || null
      case "description": {
        const parts = [school.schoolType, school.schoolLevel].filter(Boolean)
        return parts.length > 0 ? parts.join(" · ") : null
      }
      case "location": {
        const parts = [school.city, school.state, school.country].filter(
          Boolean
        )
        return parts.length > 0 ? parts.join(", ") : null
      }
      case "branding": {
        const parts = [
          school.logoUrl ? "Logo" : null,
          branding?.primaryColor,
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(" · ") : null
      }
      case "plan": {
        if (!school.planType && !school.maxStudents) return null
        const planParts = [
          school.planType,
          school.maxStudents ? `${school.maxStudents} students` : null,
        ].filter(Boolean)
        return planParts.join(" · ")
      }
      case "capacity": {
        const capParts = [
          school.maxStudents ? `${school.maxStudents} students` : null,
          school.maxTeachers ? `${school.maxTeachers} teachers` : null,
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
      case "schedule":
        return `${yearCount} ${yearCount === 1 ? "year" : "years"}, ${termCount} ${termCount === 1 ? "term" : "terms"}`
      case "join":
        return branding?.allowSelfEnrollment
          ? "Self-enrollment with codes"
          : "Manual enrollment"
      case "visibility":
        return branding?.informationSharing === "full-transparency"
          ? "Full transparency"
          : "Limited sharing"
      case "discount":
        return discountCount > 0
          ? `${discountCount} active ${discountCount === 1 ? "discount" : "discounts"}`
          : "No active discounts"
      case "legal":
        return school.planType ? `${school.planType} plan` : null
      case "modules": {
        const em = school.enabledModules as string[] | null
        if (!em)
          return lang === "ar" ? "جميع الوحدات مفعلة" : "All modules enabled"
        return lang === "ar"
          ? `${em.length} وحدة مفعلة`
          : `${em.length} modules enabled`
      }
      case "name-format":
        return school.nameFormat === "full"
          ? "Full Name (single field)"
          : "Split (First + Last)"
      case "domain": {
        if (pendingDomainRequest) {
          const status =
            pendingDomainRequest.status === "pending" ? "Pending" : "Active"
          return `${status}: ${pendingDomainRequest.domain}`
        }
        return "No custom domain"
      }
      default:
        return null
    }
  }

  const sectionLinks = SECTION_KEYS.map((key) => {
    const section = d?.[key] as
      | { title: string; description: string }
      | undefined
    const dynamicDesc = getDynamicDescription(key)

    return {
      key,
      title: key,
      description: dynamicDesc ?? section?.description ?? "",
    }
  })

  return (
    <div className="h-[calc(100vh-15rem)] overflow-hidden">
      <div className="mx-auto h-full max-w-7xl">
        <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-[auto_1fr]">
          <ConfigSidebar lang={lang} sectionLinks={sectionLinks} />
          <div className="lg:overflow-y-auto">
            <div className="flex h-full items-center justify-center">
              <div className="w-full max-w-[400px]">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
