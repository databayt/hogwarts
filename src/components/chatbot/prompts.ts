// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface SchoolChatbotData {
  name: string
  domain: string
  description?: string | null
  schoolType?: string | null
  schoolLevel?: string | null
  curriculum?: string | null
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
}

export function buildSaasMarketingPrompt(): string {
  return `You are Databayt assistant, helping visitors learn about our school automation platform. Give VERY SHORT, practical answers (2-3 sentences max).

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
4. Guide to sign-up or demo
5. Support Arabic and English`
}

export function buildSchoolSitePrompt(school: SchoolChatbotData): string {
  const sections: string[] = []

  // Identity
  sections.push(`## School: ${school.name}`)
  if (school.description) {
    sections.push(`**About**: ${school.description}`)
  }

  const details: string[] = []
  if (school.schoolType) details.push(`Type: ${school.schoolType}`)
  if (school.schoolLevel) details.push(`Level: ${school.schoolLevel}`)
  if (school.curriculum) details.push(`Curriculum: ${school.curriculum}`)
  if (details.length > 0) {
    sections.push(details.join(" | "))
  }

  // Fees
  const fees: string[] = []
  if (school.tuitionFee) {
    fees.push(`- Tuition: ${school.tuitionFee} ${school.currency}`)
  }
  if (school.registrationFee) {
    fees.push(`- Registration: ${school.registrationFee} ${school.currency}`)
  }
  if (school.applicationFee) {
    fees.push(`- Application: ${school.applicationFee} ${school.currency}`)
  }
  if (fees.length > 0) {
    sections.push(
      `## Fees\n${fees.join("\n")}\nPayment: ${school.paymentSchedule}`
    )
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

  // Admission
  sections.push(
    `## Admission\nVisitors can apply online at the school's Apply page.`
  )

  return `You are the assistant for ${school.name}, helping visitors learn about this school. Give VERY SHORT, practical answers (2-3 sentences max).

${sections.join("\n\n")}

## Response Rules
1. Keep answers under 50 words
2. Use the school's actual data above (fees, contact, etc.)
3. For admission, direct visitors to the Apply page
4. Be welcoming and professional
5. Support Arabic and English
6. If you don't have specific information, say so honestly and suggest contacting the school directly`
}

// Keep backward compatibility
export const SYSTEM_PROMPTS = {
  saasMarketing: buildSaasMarketingPrompt(),
  schoolSite:
    "You are a school assistant. Please provide the subdomain for personalized help.",
} as const

export type SystemPromptType = keyof typeof SYSTEM_PROMPTS
