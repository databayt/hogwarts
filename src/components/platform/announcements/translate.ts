"use server";

import { generateText } from "ai";
import { providers } from "@/lib/ai/providers";
import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-context";

interface TranslateInput {
  title: string;
  body: string;
  sourceLanguage: "en" | "ar";
}

interface TranslateResult {
  success: boolean;
  data?: {
    translatedTitle: string;
    translatedBody: string;
  };
  error?: string;
}

/**
 * Translate announcement content using Groq AI (free, fast)
 * Uses llama-3.1-8b-instant for cost-effective translation
 */
export async function translateAnnouncement(input: TranslateInput): Promise<TranslateResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  const { schoolId } = await getTenantContext();
  if (!schoolId) {
    return { success: false, error: "Missing school context" };
  }

  const targetLanguage = input.sourceLanguage === "en" ? "ar" : "en";
  const targetLangName = targetLanguage === "en" ? "English" : "Arabic";

  try {
    // Translate title and body in parallel for speed
    const [titleResult, bodyResult] = await Promise.all([
      generateText({
        model: providers.groq.fast, // llama-3.1-8b-instant (free tier)
        prompt: `Translate the following text to ${targetLangName}. Return ONLY the translation, no explanations or additional text:\n\n${input.title}`,
      }),
      generateText({
        model: providers.groq.fast,
        prompt: `Translate the following text to ${targetLangName}. Return ONLY the translation, no explanations or additional text:\n\n${input.body}`,
      }),
    ]);

    return {
      success: true,
      data: {
        translatedTitle: titleResult.text.trim(),
        translatedBody: bodyResult.text.trim(),
      },
    };
  } catch (error) {
    console.error("[translateAnnouncement] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed"
    };
  }
}
