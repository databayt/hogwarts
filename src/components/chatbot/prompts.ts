// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  CATEGORIES,
  FEATURES,
} from "@/components/saas-marketing/features/constants"
import { pricingData } from "@/components/saas-marketing/pricing/config"

import type { ChatbotDictionary } from "./type"

export interface SchoolChatbotData {
  name: string
  nameEn?: string | null
  domain: string
  logoUrl?: string | null
  description?: string | null
  schoolType?: string | null
  schoolLevel?: string | null
  timetableStructure?: string | null
  tuitionFee?: number | null
  registrationFee?: number | null
  applicationFee?: number | null
  currency: string
  paymentSchedule: string
  address?: string | null
  city?: string | null
  country?: string | null
  phoneNumber?: string | null
  email?: string | null
  website?: string | null
  maxStudents: number
  maxTeachers: number
  preferredLanguage: string
  // Rich context
  admissionCampaigns: {
    name: string
    academicYear: string
    startDate: Date
    endDate: Date
    status: string
    description?: string | null
    totalSeats: number
    applicationFee?: number | null
  }[]
  events: {
    title: string
    description?: string | null
    eventType: string
    eventDate: Date
    startTime: string
    endTime: string
    location?: string | null
    isPublic: boolean
  }[]
  announcements: {
    title?: string | null
    body?: string | null
    priority: string
    pinned: boolean
  }[]
  academicLevels: {
    name: string
    level: string
    startGrade: number
    endGrade: number
    grades: { name: string; gradeNumber: number }[]
  }[]
  scholarships: {
    name: string
    description?: string | null
    coverageType: string
    coverageAmount: number
    isActive: boolean
  }[]
  feeStructures: {
    name: string
    academicYear: string
    totalAmount: number
    tuitionFee: number
    installments: number
  }[]
}

/** Booleans the client uses to decide which CTA chips and quick-asks to show */
export interface SchoolChatbotContext {
  admissionOpen: boolean
  hasScholarships: boolean
  hasUpcomingEvents: boolean
  hasAnnouncements: boolean
}

export function deriveSchoolContext(
  school: SchoolChatbotData
): SchoolChatbotContext {
  const now = new Date()
  return {
    admissionOpen: school.admissionCampaigns.some(
      (c) => c.status === "OPEN" && new Date(c.endDate) > now
    ),
    hasScholarships: school.scholarships.some((s) => s.isActive),
    hasUpcomingEvents: school.events.some(
      (e) => e.isPublic && new Date(e.eventDate) >= now
    ),
    hasAnnouncements: school.announcements.length > 0,
  }
}

/**
 * Format the live `pricingData` (Hobby / Pro / Ultra) into a short bulleted
 * block injected into the SaaS system prompt. Single source of truth — when
 * marketing edits `pricing/config.ts`, the chatbot's prices update too.
 */
function formatPricing(locale: string): string {
  const isAr = locale === "ar"
  return pricingData
    .map((plan) => {
      const price =
        plan.prices.monthly === 0
          ? isAr
            ? "مجاني"
            : "Free"
          : `$${plan.prices.monthly}${isAr ? "/شهر" : "/mo"}`
      const benefits = plan.benefits.slice(0, 3).join(", ")
      return `- ${plan.title} (${price}): ${benefits}`
    })
    .join("\n")
}

/**
 * Format the live `FEATURES` constant (85 features) grouped by `CATEGORIES`
 * (10 categories) into a compact block. Trims to ~6 features per category to
 * keep the prompt within reasonable token budget.
 */
function formatFeatures(): string {
  return CATEGORIES.map((cat) => {
    const items = FEATURES.filter((f) => f.category === cat.id)
      .slice(0, 6)
      .map((f) => f.title)
      .join(", ")
    return `- ${cat.label}: ${items || "—"}`
  }).join("\n")
}

export function buildSaasMarketingPrompt(
  locale: string = "en",
  dict: Pick<ChatbotDictionary, "saasPromptTemplate">
): string {
  return dict.saasPromptTemplate
    .replace("{pricing}", formatPricing(locale))
    .replace("{features}", formatFeatures())
    .replace("{contactEmail}", "contact@databayt.org")
}

type SchoolPromptDict = Pick<
  ChatbotDictionary,
  | "schoolPromptIntroTemplate"
  | "schoolPromptRules"
  | "schoolHeaderAcademic"
  | "schoolHeaderAdmissionOpen"
  | "schoolHeaderAdmissionSoon"
  | "schoolHeaderAdmissionClosed"
  | "schoolHeaderFeesDetailed"
  | "schoolHeaderFeesBasic"
  | "schoolHeaderScholarships"
  | "schoolHeaderEvents"
  | "schoolHeaderAnnouncements"
  | "schoolHeaderContact"
  | "schoolHeaderCapacity"
  | "schoolPhraseAbout"
  | "schoolPhraseType"
  | "schoolPhraseLevel"
  | "schoolPhraseCurriculum"
  | "schoolPhraseGrades"
  | "schoolPhraseOpenUntil"
  | "schoolPhraseSeatsAvailable"
  | "schoolPhraseApplicationFee"
  | "schoolPhraseApplyOnline"
  | "schoolPhraseNextAdmission"
  | "schoolPhraseAdmissionOpens"
  | "schoolPhraseCheckBack"
  | "schoolPhraseNoCampaigns"
  | "schoolPhraseTotal"
  | "schoolPhraseTuition"
  | "schoolPhraseInstallment"
  | "schoolPhraseInstallments"
  | "schoolPhraseFullScholarship"
  | "schoolPhrasePercentageCoverage"
  | "schoolPhraseAmountOff"
  | "schoolPhrasePayment"
  | "schoolPhrasePhone"
  | "schoolPhraseEmail"
  | "schoolPhraseWebsite"
  | "schoolPhraseAddress"
  | "schoolPhraseStudents"
  | "schoolPhraseTeachers"
  | "schoolPhraseAt"
>

export function buildSchoolSitePrompt(
  school: SchoolChatbotData,
  locale: string = "en",
  dict: SchoolPromptDict
): string {
  const sections: string[] = []
  const now = new Date()
  const dateLocale = locale === "ar" ? "ar-SA" : "en-US"

  const schoolName =
    locale === "en" && school.nameEn ? school.nameEn : school.name

  // Intro line — locale-aware welcome + role
  const intro = dict.schoolPromptIntroTemplate.replace(
    "{schoolName}",
    schoolName
  )

  // Identity
  sections.push(`## ${schoolName}`)
  if (school.description) {
    sections.push(`**${dict.schoolPhraseAbout}**: ${school.description}`)
  }

  const details: string[] = []
  if (school.schoolType)
    details.push(`${dict.schoolPhraseType}: ${school.schoolType}`)
  if (school.schoolLevel)
    details.push(`${dict.schoolPhraseLevel}: ${school.schoolLevel}`)
  if (school.timetableStructure)
    details.push(`${dict.schoolPhraseCurriculum}: ${school.timetableStructure}`)
  if (details.length > 0) {
    sections.push(details.join(" | "))
  }

  // Academic Structure
  if (school.academicLevels.length > 0) {
    const levels = school.academicLevels
      .map((l) => {
        const grades = l.grades.map((g) => g.name).join(", ")
        return `- **${l.name}** (${l.level}): ${dict.schoolPhraseGrades} ${l.startGrade}-${l.endGrade}${grades ? ` — ${grades}` : ""}`
      })
      .join("\n")
    sections.push(`## ${dict.schoolHeaderAcademic}\n${levels}`)
  }

  // Admission — live status
  const openCampaigns = school.admissionCampaigns.filter(
    (c) => c.status === "OPEN" && new Date(c.endDate) > now
  )
  if (openCampaigns.length > 0) {
    const campaigns = openCampaigns
      .map((c) => {
        const deadline = new Date(c.endDate).toLocaleDateString(dateLocale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        const fee = c.applicationFee
          ? ` | ${dict.schoolPhraseApplicationFee}: ${c.applicationFee} ${school.currency}`
          : ""
        return `- **${c.name}** (${c.academicYear}): ${dict.schoolPhraseOpenUntil} ${deadline}, ${c.totalSeats} ${dict.schoolPhraseSeatsAvailable}${fee}`
      })
      .join("\n")
    sections.push(
      `## ${dict.schoolHeaderAdmissionOpen}\n${campaigns}\n${dict.schoolPhraseApplyOnline}`
    )
  } else {
    const upcoming = school.admissionCampaigns.filter(
      (c) => c.status === "DRAFT" && new Date(c.startDate) > now
    )
    if (upcoming.length > 0) {
      const next = upcoming[0]
      const opens = new Date(next.startDate).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      sections.push(
        `## ${dict.schoolHeaderAdmissionSoon}\n${dict.schoolPhraseNextAdmission}: **${next.name}** (${next.academicYear}) ${dict.schoolPhraseAdmissionOpens} ${opens}.\n${dict.schoolPhraseCheckBack}`
      )
    } else {
      sections.push(
        `## ${dict.schoolHeaderAdmissionClosed}\n${dict.schoolPhraseNoCampaigns}`
      )
    }
  }

  // Fee Structures
  if (school.feeStructures.length > 0) {
    const fees = school.feeStructures
      .map((f) => {
        const installmentLabel =
          f.installments > 1
            ? dict.schoolPhraseInstallments
            : dict.schoolPhraseInstallment
        return `- **${f.name}** (${f.academicYear}): ${f.totalAmount} ${school.currency} ${dict.schoolPhraseTotal} (${dict.schoolPhraseTuition}: ${f.tuitionFee} ${school.currency}, ${f.installments} ${installmentLabel})`
      })
      .join("\n")
    sections.push(`## ${dict.schoolHeaderFeesDetailed}\n${fees}`)
  } else {
    // Fallback to basic school-level fees
    const fees: string[] = []
    if (school.tuitionFee)
      fees.push(
        `- ${dict.schoolPhraseTuition}: ${school.tuitionFee} ${school.currency}`
      )
    if (school.registrationFee)
      fees.push(
        `- ${dict.schoolPhraseApplicationFee}: ${school.registrationFee} ${school.currency}`
      )
    if (school.applicationFee)
      fees.push(
        `- ${dict.schoolPhraseApplicationFee}: ${school.applicationFee} ${school.currency}`
      )
    if (fees.length > 0) {
      sections.push(
        `## ${dict.schoolHeaderFeesBasic}\n${fees.join("\n")}\n${dict.schoolPhrasePayment}: ${school.paymentSchedule}`
      )
    }
  }

  // Scholarships
  const activeScholarships = school.scholarships.filter((s) => s.isActive)
  if (activeScholarships.length > 0) {
    const schols = activeScholarships
      .map((s) => {
        const coverage =
          s.coverageType === "FULL"
            ? dict.schoolPhraseFullScholarship
            : s.coverageType === "PERCENTAGE"
              ? `${s.coverageAmount}${dict.schoolPhrasePercentageCoverage}`
              : `${s.coverageAmount} ${school.currency} ${dict.schoolPhraseAmountOff}`
        return `- **${s.name}**: ${coverage}${s.description ? ` — ${s.description}` : ""}`
      })
      .join("\n")
    sections.push(`## ${dict.schoolHeaderScholarships}\n${schols}`)
  }

  // Upcoming Events
  const upcomingEvents = school.events
    .filter((e) => e.isPublic && new Date(e.eventDate) >= now)
    .slice(0, 5)
  if (upcomingEvents.length > 0) {
    const events = upcomingEvents
      .map((e) => {
        const date = new Date(e.eventDate).toLocaleDateString(dateLocale, {
          month: "long",
          day: "numeric",
        })
        const loc = e.location ? ` ${dict.schoolPhraseAt} ${e.location}` : ""
        return `- **${e.title}** (${e.eventType}): ${date}, ${e.startTime}-${e.endTime}${loc}`
      })
      .join("\n")
    sections.push(`## ${dict.schoolHeaderEvents}\n${events}`)
  }

  // Important Announcements
  const importantAnnouncements = school.announcements
    .filter((a) => a.pinned || a.priority === "high" || a.priority === "urgent")
    .slice(0, 3)
  if (importantAnnouncements.length > 0) {
    const anns = importantAnnouncements
      .map((a) => `- ${a.title || ""}`)
      .join("\n")
    sections.push(`## ${dict.schoolHeaderAnnouncements}\n${anns}`)
  }

  // Contact
  const contact: string[] = []
  if (school.phoneNumber)
    contact.push(`- ${dict.schoolPhrasePhone}: ${school.phoneNumber}`)
  if (school.email) contact.push(`- ${dict.schoolPhraseEmail}: ${school.email}`)
  if (school.website)
    contact.push(`- ${dict.schoolPhraseWebsite}: ${school.website}`)
  const location: string[] = []
  if (school.address) location.push(school.address)
  if (school.city) location.push(school.city)
  if (school.country) location.push(school.country)
  if (location.length > 0)
    contact.push(`- ${dict.schoolPhraseAddress}: ${location.join(", ")}`)
  if (contact.length > 0) {
    sections.push(`## ${dict.schoolHeaderContact}\n${contact.join("\n")}`)
  }

  // Capacity
  if (school.maxStudents || school.maxTeachers) {
    sections.push(
      `## ${dict.schoolHeaderCapacity}\n${dict.schoolPhraseStudents}: ${school.maxStudents} | ${dict.schoolPhraseTeachers}: ${school.maxTeachers}`
    )
  }

  return `${intro}\n\n${sections.join("\n\n")}\n\n${dict.schoolPromptRules}`
}

// Backwards-compat surface — used only by older imports of `SystemPromptType`
export type SystemPromptType = "saasMarketing" | "schoolSite"
