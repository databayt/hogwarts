// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * What the panel offers before and after an answer, per mode — the quick
 * asks of an empty chat, the CTA chips under the latest answer, the title
 * and the welcome line. All from the dictionary and the school's flags,
 * never from model output. Paths use `/${locale}/…` only — never
 * `/s/${subdomain}/…` (CLAUDE.md gotcha 9).
 */
import { mainOriginFromLocation } from "@/lib/root-domain"

import { CONTACT_EMAIL } from "./constant"
import { InfoIcon, PriceIcon, ServicesIcon, TimeIcon } from "./icons"
import type {
  ChatbotDictionary,
  CtaChip,
  PromptType,
  SchoolChatbotDisplay,
  SupportRole,
} from "./type"

export interface QuickAsk {
  label: string
  question: string
  icon: typeof InfoIcon
}

export function quickAsks(
  promptType: PromptType,
  dictionary: ChatbotDictionary,
  supportRole: SupportRole = "admin",
  schoolContext?: SchoolChatbotDisplay | null
): QuickAsk[] {
  const ask = (key: string, icon: typeof InfoIcon): QuickAsk => ({
    label: dictionary[key] ?? "",
    question: dictionary[`${key}Question`] ?? "",
    icon,
  })

  if (promptType === "schoolSupport") {
    // What each audience asks most — the guides written for them.
    if (supportRole === "teacher")
      return [
        ask("supportStartLive", TimeIcon),
        ask("supportAttendance", TimeIcon),
        ask("supportGrades", ServicesIcon),
        ask("supportPassword", InfoIcon),
      ]
    if (supportRole === "student")
      return [
        ask("supportJoinLive", TimeIcon),
        ask("supportHomework", ServicesIcon),
        ask("supportTimetable", TimeIcon),
        ask("supportPassword", InfoIcon),
      ]
    if (supportRole === "parent")
      return [
        ask("supportWatchLive", TimeIcon),
        ask("supportChildGrades", ServicesIcon),
        ask("supportChildFees", PriceIcon),
        ask("supportPassword", InfoIcon),
      ]
    return [
      ask("supportOnlineSchool", TimeIcon),
      ask("supportAddStudent", ServicesIcon),
      ask("supportFees", PriceIcon),
      ask("supportRoles", InfoIcon),
    ]
  }

  if (promptType === "schoolSite") {
    const asks = [
      ask("schoolAdmission", ServicesIcon),
      ask("schoolFees", PriceIcon),
    ]
    // Context-aware: scholarships and events only when the school has them.
    if (schoolContext?.hasScholarships)
      asks.push(ask("schoolScholarships", PriceIcon))
    if (schoolContext?.hasUpcomingEvents)
      asks.push(ask("schoolEvents", TimeIcon))
    if (asks.length < 4) asks.push(ask("schoolPrograms", TimeIcon))
    if (asks.length < 4) asks.push(ask("schoolContact", InfoIcon))
    return asks.slice(0, 4)
  }

  return [
    ask("saasFeatures", ServicesIcon),
    ask("saasPricing", PriceIcon),
    ask("saasGetStarted", TimeIcon),
    ask("saasSupport", InfoIcon),
  ]
}

export function ctaChips(
  promptType: PromptType,
  dictionary: ChatbotDictionary,
  locale: string,
  schoolContext?: SchoolChatbotDisplay | null
): CtaChip[] {
  if (promptType === "schoolSupport") {
    // A school subdomain has no help center of its own — link the main
    // domain's. The email carries the page so we can see what they saw;
    // read at click time (see `mailHref`), never cached at render.
    return [
      {
        label: dictionary.ctaHelpCenter,
        href: `${mainOriginFromLocation()}/${locale}/docs/support`,
        external: true,
      },
      {
        label: dictionary.ctaEmailSupport,
        href: `mailto:${CONTACT_EMAIL}`,
        external: true,
      },
    ]
  }
  if (promptType === "saasMarketing") {
    return [
      { label: dictionary.ctaTryFree, href: `/${locale}/onboarding` },
      { label: dictionary.ctaSeePricing, href: `/${locale}/pricing` },
      { label: dictionary.ctaViewFeatures, href: `/${locale}/features` },
      { label: dictionary.ctaHelpCenter, href: `/${locale}/docs/support` },
    ]
  }
  const chips: CtaChip[] = []
  if (schoolContext?.admissionOpen)
    chips.push({
      label: dictionary.ctaStartApplication,
      href: `/${locale}/application`,
    })
  chips.push({ label: dictionary.ctaBookTour, href: `/${locale}/tour` })
  chips.push({ label: dictionary.ctaSendInquiry, href: `/${locale}/inquiry` })
  if (schoolContext?.hasScholarships)
    chips.push({
      label: dictionary.ctaViewScholarships,
      href: `/${locale}/admissions#scholarships`,
    })
  return chips.slice(0, 3)
}

/** The support email, carrying the page the member is on right now. */
export function mailHref(dictionary: ChatbotDictionary): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    dictionary.ctaEmailSupport
  )}&body=${encodeURIComponent(window.location.href)}`
}

export function panelTitle(
  promptType: PromptType,
  dictionary: ChatbotDictionary,
  locale: string,
  schoolContext?: SchoolChatbotDisplay | null
): string {
  if (promptType === "schoolSite" && schoolContext)
    return locale === "ar"
      ? schoolContext.schoolNameAr
      : schoolContext.schoolName
  if (promptType === "schoolSupport") return dictionary.titleSupport
  return dictionary.title
}

export function welcomeText(
  promptType: PromptType,
  dictionary: ChatbotDictionary,
  locale: string,
  schoolContext?: SchoolChatbotDisplay | null
): string {
  if (promptType === "schoolSite" && schoolContext) {
    const name =
      locale === "ar" ? schoolContext.schoolNameAr : schoolContext.schoolName
    return dictionary.welcomeSchoolTemplate.replace("{name}", name)
  }
  if (promptType === "schoolSupport") return dictionary.welcomeSupport
  return dictionary.welcomeSaas
}
