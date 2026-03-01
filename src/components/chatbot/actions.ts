"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createGroq } from "@ai-sdk/groq"
import { CoreMessage, generateText } from "ai"

import { db } from "@/lib/db"

import {
  buildSaasMarketingPrompt,
  buildSchoolSitePrompt,
  type SchoolChatbotData,
  type SystemPromptType,
} from "./prompts"

export async function sendMessage(
  messages: CoreMessage[],
  systemPromptType: SystemPromptType = "saasMarketing",
  subdomain?: string
) {
  try {
    // Check if API key is available
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return {
        success: false,
        error:
          "Groq API key not configured. Please add GROQ_API_KEY to your .env file.",
      }
    }

    // Build the system prompt
    let systemPrompt: string

    if (systemPromptType === "schoolSite" && subdomain) {
      const school = await db.school.findUnique({
        where: { domain: subdomain },
        select: {
          name: true,
          domain: true,
          description: true,
          schoolType: true,
          schoolLevel: true,
          curriculum: true,
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
        },
      })

      if (school) {
        const schoolData: SchoolChatbotData = {
          ...school,
          tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : null,
          registrationFee: school.registrationFee
            ? Number(school.registrationFee)
            : null,
          applicationFee: school.applicationFee
            ? Number(school.applicationFee)
            : null,
        }
        systemPrompt = buildSchoolSitePrompt(schoolData)
      } else {
        systemPrompt = buildSaasMarketingPrompt()
      }
    } else {
      systemPrompt = buildSaasMarketingPrompt()
    }

    // Create groq instance inside function to ensure env var is available
    const groq = createGroq({
      apiKey: apiKey,
    })

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
