// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getDisplayText } from "@/lib/content-display"
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
  const [school, branding, yearCount, termCount, discountCount] =
    await Promise.all([
      schoolId
        ? db.school.findUnique({
            where: { id: schoolId },
            select: {
              name: true,
              preferredLanguage: true,
              schoolType: true,
              schoolLevel: true,
              city: true,
              state: true,
              country: true,
              logoUrl: true,
              planType: true,
              maxStudents: true,
              maxTeachers: true,
              tuitionFee: true,
              currency: true,
              paymentSchedule: true,
            },
          })
        : null,
      schoolId
        ? db.schoolBranding.findUnique({
            where: { schoolId },
            select: {
              primaryColor: true,
              isPubliclyListed: true,
              allowSelfEnrollment: true,
              informationSharing: true,
            },
          })
        : null,
      schoolId ? db.schoolYear.count({ where: { schoolId } }) : 0,
      schoolId ? db.term.count({ where: { schoolId } }) : 0,
      schoolId ? db.discount.count({ where: { schoolId, isActive: true } }) : 0,
    ])

  const SECTION_KEYS = [
    "title",
    "description",
    "location",
    "capacity",
    "schedule",
    "branding",
    "join",
    "visibility",
    "price",
    "discount",
    "legal",
    "plan",
  ] as const

  // Build dynamic descriptions from live data
  async function getDynamicDescription(key: string): Promise<string | null> {
    if (!school) return null

    switch (key) {
      case "title": {
        if (!school.name || !schoolId) return null
        const contentLang = (school.preferredLanguage || "ar") as "ar" | "en"
        return getDisplayText(school.name, contentLang, lang, schoolId)
      }
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
      case "plan":
        return `${school.planType} · ${school.maxStudents} students`
      case "capacity":
        return `${school.maxStudents} students, ${school.maxTeachers} teachers`
      case "price": {
        if (!school.tuitionFee) return null
        return `${school.currency} ${Number(school.tuitionFee).toLocaleString()}/${school.paymentSchedule}`
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
        title: key,
        description: dynamicDesc ?? section?.description ?? "",
      }
    })
  )

  return (
    <div className="h-[calc(100vh-15rem)] overflow-hidden">
      <div className="mx-auto h-full max-w-7xl">
        <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-3">
          <ConfigSidebar lang={lang} sectionLinks={sectionLinks} />
          <div className="lg:col-span-2 lg:overflow-y-auto">
            <div className="flex h-full items-center justify-center">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
