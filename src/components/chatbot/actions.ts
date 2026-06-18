"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createGroq } from "@ai-sdk/groq"
import { CoreMessage, generateText } from "ai"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import {
  buildSaasMarketingPrompt,
  buildSchoolSitePrompt,
  deriveSchoolContext,
  type SchoolChatbotData,
  type SystemPromptType,
} from "./prompts"
import type { ChatbotDictionary, SchoolChatbotDisplay } from "./type"

/**
 * Returns the display + visibility context the chatbot client needs:
 * personalised welcome (school name), branded avatar (logo), and the
 * boolean flags that decide which CTA chips to surface.
 *
 * Returns `null` when the subdomain doesn't resolve to a school —
 * the client falls back to the SaaS welcome.
 */
export async function getSchoolChatbotDisplay(
  subdomain: string
): Promise<SchoolChatbotDisplay | null> {
  const school = await fetchSchoolData(subdomain)
  if (!school) return null
  const flags = deriveSchoolContext(school)
  return {
    ...flags,
    schoolName: school.nameEn ?? school.name,
    schoolNameAr: school.name,
    logoUrl: school.logoUrl ?? null,
  }
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
      logoUrl: true,
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

/**
 * Server-side resolution of the system prompt for either mode. The dictionary
 * is loaded here (not on the client) so we never ship the entire prompt text
 * over the network — only the assistant's response.
 */
async function resolveSystemPrompt(
  systemPromptType: SystemPromptType,
  subdomain: string | undefined,
  locale: string
): Promise<string> {
  const dictionary = await getDictionary(locale as Locale)
  const chatbot = dictionary.chatbot as unknown as ChatbotDictionary

  if (systemPromptType === "schoolSite" && subdomain) {
    const schoolData = await fetchSchoolData(subdomain)
    if (schoolData) {
      return buildSchoolSitePrompt(schoolData, locale, chatbot)
    }
  }

  return buildSaasMarketingPrompt(locale, chatbot)
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

    const systemPrompt = await resolveSystemPrompt(
      systemPromptType,
      subdomain,
      locale
    )

    const groq = createGroq({ apiKey })

    // Keep only the most recent turns. The system prompt already carries the
    // full knowledge base (live pricing, features, or school data), so older
    // small-talk adds little — trimming keeps the model on-task and bounds
    // latency/cost.
    const recentMessages = messages.slice(-10)

    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      messages: recentMessages,
      system: systemPrompt,
      // Low temperature → factual, on-script answers (never invent prices).
      temperature: 0.3,
      // Caps replies at ~2–3 sentences or a short list — tight and snappy.
      maxOutputTokens: 400,
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
