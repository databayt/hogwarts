"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { translateWithCache } from "@/lib/translate"

interface TranslateInput {
  title: string
  body: string
  sourceLanguage: "en" | "ar"
}

interface TranslateResult {
  success: boolean
  data?: {
    translatedTitle: string
    translatedBody: string
  }
  error?: string
}

/**
 * Translate announcement content using Google Translate API with DB caching
 */
export async function translateAnnouncement(
  input: TranslateInput
): Promise<TranslateResult> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Not authenticated" }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const targetLanguage = input.sourceLanguage === "en" ? "ar" : "en"

  try {
    const [translatedTitle, translatedBody] = await Promise.all([
      translateWithCache(
        input.title,
        input.sourceLanguage,
        targetLanguage,
        schoolId
      ),
      translateWithCache(
        input.body,
        input.sourceLanguage,
        targetLanguage,
        schoolId
      ),
    ])

    return {
      success: true,
      data: {
        translatedTitle,
        translatedBody,
      },
    }
  } catch (error) {
    console.error("[translateAnnouncement] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}
