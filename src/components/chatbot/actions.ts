"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createGroq } from "@ai-sdk/groq"
import { CoreMessage, generateText } from "ai"

import { db } from "@/lib/db"

import {
  buildSaasMarketingPrompt,
  buildSchoolSitePrompt,
  deriveSchoolContext,
  type SchoolChatbotContext,
  type SchoolChatbotData,
  type SystemPromptType,
} from "./prompts"

export async function getSchoolChatbotContext(
  subdomain: string
): Promise<SchoolChatbotContext | null> {
  const school = await fetchSchoolData(subdomain)
  if (!school) return null
  return deriveSchoolContext(school)
}

async function fetchSchoolData(
  subdomain: string
): Promise<SchoolChatbotData | null> {
  const now = new Date()

  const school = await db.school.findUnique({
    where: { domain: subdomain },
    select: {
      name: true,
      nameEn: true,
      domain: true,
      description: true,
      schoolType: true,
      schoolLevel: true,
      timetableStructure: true,
      tuitionFee: true,
      registrationFee: true,
      applicationFee: true,
      currency: true,
      paymentSchedule: true,
      address: true,
      city: true,
      country: true,
      phoneNumber: true,
      email: true,
      website: true,
      maxStudents: true,
      maxTeachers: true,
      preferredLanguage: true,
      admissionCampaigns: {
        where: {
          OR: [
            { status: "OPEN", endDate: { gte: now } },
            { status: "DRAFT", startDate: { gte: now } },
          ],
        },
        select: {
          name: true,
          academicYear: true,
          startDate: true,
          endDate: true,
          status: true,
          description: true,
          totalSeats: true,
          applicationFee: true,
        },
        orderBy: { startDate: "asc" },
        take: 3,
      },
      events: {
        where: { isPublic: true, eventDate: { gte: now }, status: "PLANNED" },
        select: {
          title: true,
          description: true,
          eventType: true,
          eventDate: true,
          startTime: true,
          endTime: true,
          location: true,
          isPublic: true,
        },
        orderBy: { eventDate: "asc" },
        take: 5,
      },
      announcements: {
        where: {
          published: true,
          OR: [{ pinned: true }, { priority: { in: ["high", "urgent"] } }],
        },
        select: {
          title: true,
          body: true,
          priority: true,
          pinned: true,
        },
        take: 3,
      },
      academicLevels: {
        select: {
          name: true,
          level: true,
          startGrade: true,
          endGrade: true,
          grades: {
            select: { name: true, gradeNumber: true },
            orderBy: { gradeNumber: "asc" },
          },
        },
        orderBy: { levelOrder: "asc" },
      },
      scholarships: {
        where: { isActive: true },
        select: {
          name: true,
          description: true,
          coverageType: true,
          coverageAmount: true,
          isActive: true,
        },
        take: 5,
      },
      feeStructures: {
        select: {
          name: true,
          academicYear: true,
          totalAmount: true,
          tuitionFee: true,
          installments: true,
        },
        take: 5,
      },
    },
  })

  if (!school) return null

  return {
    ...school,
    tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : null,
    registrationFee: school.registrationFee
      ? Number(school.registrationFee)
      : null,
    applicationFee: school.applicationFee
      ? Number(school.applicationFee)
      : null,
    admissionCampaigns: school.admissionCampaigns.map((c) => ({
      ...c,
      applicationFee: c.applicationFee ? Number(c.applicationFee) : null,
    })),
    scholarships: school.scholarships.map((s) => ({
      ...s,
      coverageAmount: Number(s.coverageAmount),
    })),
    feeStructures: school.feeStructures.map((f) => ({
      ...f,
      totalAmount: Number(f.totalAmount),
      tuitionFee: Number(f.tuitionFee),
    })),
  }
}

export async function sendMessage(
  messages: CoreMessage[],
  systemPromptType: SystemPromptType = "saasMarketing",
  subdomain?: string,
  locale: string = "en"
) {
  try {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return {
        success: false,
        error:
          "Groq API key not configured. Please add GROQ_API_KEY to your .env file.",
      }
    }

    let systemPrompt: string

    if (systemPromptType === "schoolSite" && subdomain) {
      const schoolData = await fetchSchoolData(subdomain)
      if (schoolData) {
        systemPrompt = buildSchoolSitePrompt(schoolData, locale)
      } else {
        systemPrompt = buildSaasMarketingPrompt(locale)
      }
    } else {
      systemPrompt = buildSaasMarketingPrompt(locale)
    }

    const groq = createGroq({ apiKey })

    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      messages,
      system: systemPrompt,
    })

    return {
      success: true,
      content: result.text,
    }
  } catch (error) {
    console.error("Server Action Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    }
  }
}
