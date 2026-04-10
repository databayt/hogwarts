// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface SchoolChatbotData {
  name: string
  nameEn?: string | null
  domain: string
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

/** Context about which quick-ask buttons to show, derived from school data */
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

export function buildSaasMarketingPrompt(locale: string = "en"): string {
  const lang =
    locale === "ar"
      ? "Arabic. Always respond in Arabic."
      : "English. Always respond in English."

  return `You are Databayt assistant, helping visitors learn about our school automation platform. Respond in ${lang} Give VERY SHORT, practical answers (2-3 sentences max).

## About Databayt
- **Platform**: Databayt - Open-source school management & automation
- **Mission**: Automate school operations so educators focus on teaching
- **Open Source**: 100% open-source, self-hostable, community-driven

## Pricing
- **Hobby** (Free): Up to 100 students, 10 teachers, core features
- **Pro** ($20/month, $192/year): Up to 500 students, unlimited teachers, advanced reports, custom branding
- **Ultra** ($200/month, $1,920/year): Unlimited students & teachers, custom integrations, 24/7 support

## Features (14 categories, 48+ features)
- **Students**: Enrollment, profiles, year levels, performance tracking, guardians
- **Teachers**: Profiles, qualifications, workload, scheduling, departments
- **Attendance**: Manual, QR code, barcode, geo-fencing, bulk upload, analytics, interventions
- **Grades & Exams**: Gradebook, report cards, exam creation, AI generation, question bank, certificates
- **Timetable**: Auto-scheduling, room allocation, teacher constraints, templates
- **Subjects & Curriculum**: Subject management, catalog, chapters, lesson planning
- **Finance**: Fee collection, invoicing, payment tracking, payroll, banking
- **Admission**: Online applications, merit lists, enrollment pipeline, document upload
- **Announcements**: School-wide, targeted, scheduling, archiving
- **Events**: Calendar, categories, recurring, attendance tracking
- **Classrooms**: Room management, capacity, equipment, scheduling
- **Analytics**: Dashboards, reports, student analysis, attendance trends
- **Communication**: Parent portal, messaging, notifications
- **Settings**: Branding, roles & permissions, school configuration

## Impact
- 80% administrative time saved
- 60% cost reduction vs manual processes
- 25% enrollment boost through online admission

## FAQs
- **Is it free?** Yes, Hobby plan is free forever for up to 100 students
- **Setup time?** Under 10 minutes with guided onboarding
- **Support?** Community support (free), priority (Pro), 24/7 (Ultra)
- **Open source?** Yes, MIT-style license, self-host or use our cloud
- **Contributing?** Visit our GitHub repository to contribute

## Contact
- Email: contact@databayt.org
- GitHub: github.com/databayt
- Website: ed.databayt.org

## Response Rules
1. Keep answers under 50 words
2. Use specific numbers (pricing, student limits)
3. Mention open-source benefits when relevant
4. Guide to sign-up or demo`
}

export function buildSchoolSitePrompt(
  school: SchoolChatbotData,
  locale: string = "en"
): string {
  const sections: string[] = []
  const now = new Date()

  const lang =
    locale === "ar"
      ? "Arabic. Always respond in Arabic."
      : "English. Always respond in English."

  const schoolName =
    locale === "en" && school.nameEn ? school.nameEn : school.name

  // Identity
  sections.push(`## School: ${schoolName}`)
  if (school.description) {
    sections.push(`**About**: ${school.description}`)
  }

  const details: string[] = []
  if (school.schoolType) details.push(`Type: ${school.schoolType}`)
  if (school.schoolLevel) details.push(`Level: ${school.schoolLevel}`)
  if (school.timetableStructure)
    details.push(`Curriculum: ${school.timetableStructure}`)
  if (details.length > 0) {
    sections.push(details.join(" | "))
  }

  // Academic Structure
  if (school.academicLevels.length > 0) {
    const levels = school.academicLevels
      .map((l) => {
        const grades = l.grades.map((g) => g.name).join(", ")
        return `- **${l.name}** (${l.level}): Grades ${l.startGrade}-${l.endGrade}${grades ? ` — ${grades}` : ""}`
      })
      .join("\n")
    sections.push(`## Academic Structure\n${levels}`)
  }

  // Admission — live status
  const openCampaigns = school.admissionCampaigns.filter(
    (c) => c.status === "OPEN" && new Date(c.endDate) > now
  )
  if (openCampaigns.length > 0) {
    const campaigns = openCampaigns
      .map((c) => {
        const deadline = new Date(c.endDate).toLocaleDateString(
          locale === "ar" ? "ar-SA" : "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        )
        const fee = c.applicationFee
          ? ` | Application fee: ${c.applicationFee} ${school.currency}`
          : ""
        return `- **${c.name}** (${c.academicYear}): Open until ${deadline}, ${c.totalSeats} seats available${fee}`
      })
      .join("\n")
    sections.push(
      `## Admission — OPEN NOW\n${campaigns}\nVisitors can apply online at the school's Apply page.`
    )
  } else {
    const upcoming = school.admissionCampaigns.filter(
      (c) => c.status === "DRAFT" && new Date(c.startDate) > now
    )
    if (upcoming.length > 0) {
      const next = upcoming[0]
      const opens = new Date(next.startDate).toLocaleDateString(
        locale === "ar" ? "ar-SA" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      )
      sections.push(
        `## Admission — COMING SOON\nNext admission period: **${next.name}** (${next.academicYear}) opens ${opens}.\nAdvise visitors to check back or contact the school.`
      )
    } else {
      sections.push(
        `## Admission\nNo admission campaigns are currently open. Suggest contacting the school for next intake dates.`
      )
    }
  }

  // Fee Structures
  if (school.feeStructures.length > 0) {
    const fees = school.feeStructures
      .map(
        (f) =>
          `- **${f.name}** (${f.academicYear}): ${f.totalAmount} ${school.currency} total (tuition: ${f.tuitionFee} ${school.currency}, ${f.installments} installment${f.installments > 1 ? "s" : ""})`
      )
      .join("\n")
    sections.push(`## Detailed Fees\n${fees}`)
  } else {
    // Fallback to basic school-level fees
    const fees: string[] = []
    if (school.tuitionFee)
      fees.push(`- Tuition: ${school.tuitionFee} ${school.currency}`)
    if (school.registrationFee)
      fees.push(`- Registration: ${school.registrationFee} ${school.currency}`)
    if (school.applicationFee)
      fees.push(`- Application: ${school.applicationFee} ${school.currency}`)
    if (fees.length > 0) {
      sections.push(
        `## Fees\n${fees.join("\n")}\nPayment: ${school.paymentSchedule}`
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
            ? "Full scholarship"
            : s.coverageType === "PERCENTAGE"
              ? `${s.coverageAmount}% coverage`
              : `${s.coverageAmount} ${school.currency} off`
        return `- **${s.name}**: ${coverage}${s.description ? ` — ${s.description}` : ""}`
      })
      .join("\n")
    sections.push(`## Scholarships & Financial Aid\n${schols}`)
  }

  // Upcoming Events
  const upcomingEvents = school.events
    .filter((e) => e.isPublic && new Date(e.eventDate) >= now)
    .slice(0, 5)
  if (upcomingEvents.length > 0) {
    const events = upcomingEvents
      .map((e) => {
        const date = new Date(e.eventDate).toLocaleDateString(
          locale === "ar" ? "ar-SA" : "en-US",
          { month: "long", day: "numeric" }
        )
        const loc = e.location ? ` at ${e.location}` : ""
        return `- **${e.title}** (${e.eventType}): ${date}, ${e.startTime}-${e.endTime}${loc}`
      })
      .join("\n")
    sections.push(`## Upcoming Events\n${events}`)
  }

  // Important Announcements
  const importantAnnouncements = school.announcements
    .filter((a) => a.pinned || a.priority === "high" || a.priority === "urgent")
    .slice(0, 3)
  if (importantAnnouncements.length > 0) {
    const anns = importantAnnouncements
      .map((a) => `- ${a.title || "Announcement"}`)
      .join("\n")
    sections.push(`## Important Announcements\n${anns}`)
  }

  // Contact
  const contact: string[] = []
  if (school.phoneNumber) contact.push(`- Phone: ${school.phoneNumber}`)
  if (school.email) contact.push(`- Email: ${school.email}`)
  if (school.website) contact.push(`- Website: ${school.website}`)
  const location: string[] = []
  if (school.address) location.push(school.address)
  if (school.city) location.push(school.city)
  if (school.country) location.push(school.country)
  if (location.length > 0) contact.push(`- Address: ${location.join(", ")}`)
  if (contact.length > 0) {
    sections.push(`## Contact\n${contact.join("\n")}`)
  }

  // Capacity
  if (school.maxStudents || school.maxTeachers) {
    sections.push(
      `## Capacity\nStudents: ${school.maxStudents} | Teachers: ${school.maxTeachers}`
    )
  }

  return `You are the helpful assistant for ${schoolName}. Respond in ${lang} You help prospective students and parents learn about this school. Be welcoming, accurate, and concise (2-3 sentences max).

${sections.join("\n\n")}

## Response Rules
1. Keep answers under 60 words
2. Use the school's actual data above — never invent facts
3. For admission, give the current status (open/closed/coming soon) and direct to the Apply page when open
4. Mention scholarships when discussing fees if available
5. Mention upcoming events when relevant
6. If you don't have specific information, say so honestly and suggest contacting the school directly
7. When asked about programs or grades, reference the academic structure above`
}

// Keep backward compatibility
export const SYSTEM_PROMPTS = {
  saasMarketing: buildSaasMarketingPrompt(),
  schoolSite:
    "You are a school assistant. Please provide the subdomain for personalized help.",
} as const

export type SystemPromptType = keyof typeof SYSTEM_PROMPTS
