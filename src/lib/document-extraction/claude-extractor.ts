// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Claude Vision Extractor
 * Uses Anthropic Claude for AI-powered document extraction
 * Pattern based on receipt extraction implementation
 */

import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"

import { logger } from "@/lib/logger"

import { getPromptForStep, systemMessage } from "./prompts"
import { stepSchemaMap } from "./schemas"
import type { OnboardingStep } from "./types"

/**
 * Extract structured data from document image using Claude 3.5 Sonnet
 * @param fileUrl - Public URL or base64-encoded image data
 * @param stepId - Onboarding step identifier
 * @returns Extracted structured data
 */
export async function extractWithClaude(
  fileUrl: string,
  stepId: OnboardingStep
) {
  const schema = stepSchemaMap[stepId]
  const prompt = getPromptForStep(stepId)
  return extractWithClaudeGeneric(fileUrl, schema, prompt, stepId)
}

/**
 * Generic extraction: accepts any Zod schema and prompt
 * Used by both onboarding (via extractWithClaude wrapper) and domain-specific extractors
 */
export async function extractWithClaudeGeneric(
  input: string,
  schema: import("zod").ZodType,
  prompt: string,
  context?: string,
  options?: { systemPrompt?: string; useTextInput?: boolean }
) {
  const startTime = Date.now()

  try {
    logger.info("Starting document extraction with Claude", {
      action: "extract_document_data",
      context: context || "generic",
      inputPreview: input.substring(0, 50) + "...",
    })

    const sysPrompt = options?.systemPrompt || systemMessage

    // Build message content based on input type
    const isBase64OrUrl = input.startsWith("data:") || input.startsWith("http")
    const useAsImage = isBase64OrUrl && !options?.useTextInput

    const content: Array<
      { type: "image"; image: string } | { type: "text"; text: string }
    > = useAsImage
      ? [
          { type: "image", image: input },
          { type: "text", text: `${sysPrompt}\n\n${prompt}` },
        ]
      : [
          {
            type: "text",
            text: `${sysPrompt}\n\n${prompt}\n\n--- DOCUMENT CONTENT ---\n${input}`,
          },
        ]

    const result = await generateObject({
      model: anthropic("claude-3-5-sonnet-20241022"),
      schema,
      messages: [{ role: "user", content }],
    })

    const processingTime = Date.now() - startTime

    logger.info("Document extraction completed", {
      action: "extract_document_success",
      context: context || "generic",
      processingTime,
      fields: Object.keys(result.object as Record<string, unknown>).length,
    })

    return {
      success: true,
      data: result.object,
      processingTime,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime

    logger.error(
      "Document extraction failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "extract_document_error",
        context: context || "generic",
        processingTime,
      }
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : "Extraction failed",
      processingTime,
    }
  }
}

/**
 * Convert File to base64 data URL for Claude Vision API
 * @param file - File object to convert
 * @returns Base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert buffer to base64 data URL
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @returns Base64 data URL
 */
export function bufferToBase64(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64")
  return `data:${mimeType};base64,${base64}`
}
