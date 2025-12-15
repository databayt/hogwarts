"use server"

import { createGroq } from "@ai-sdk/groq"
import { CoreMessage, generateText } from "ai"

import { SYSTEM_PROMPTS, type SystemPromptType } from "./prompts"

export async function sendMessage(
  messages: CoreMessage[],
  systemPromptType: SystemPromptType = "saasMarketing"
) {
  try {
    // Check if API key is available
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return {
        success: false,
        error:
          "Groq API key not configured. Please add GROQ_API_KEY to your .env.local file.",
      }
    }

    const systemPrompt = SYSTEM_PROMPTS[systemPromptType]

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
