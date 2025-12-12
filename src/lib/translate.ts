"use server";

import { generateText } from "ai";
import { providers } from "@/lib/ai/providers";
import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-context";

interface TranslateTextInput {
  text: string;
  sourceLanguage: "en" | "ar";
}

interface TranslateTextResult {
  success: boolean;
  translated?: string;
  error?: string;
}

interface TranslateFieldsInput {
  fields: Record<string, string>;
  sourceLanguage: "en" | "ar";
}

interface TranslateFieldsResult {
  success: boolean;
  translated?: Record<string, string>;
  error?: string;
}

/**
 * Translate a single text using Groq AI (free, fast)
 * Uses llama-3.1-8b-instant for cost-effective translation
 */
export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  const { schoolId } = await getTenantContext();
  if (!schoolId) {
    return { success: false, error: "Missing school context" };
  }

  if (!input.text || input.text.trim() === "") {
    return { success: true, translated: "" };
  }

  const targetLang = input.sourceLanguage === "en" ? "Arabic" : "English";

  try {
    const result = await generateText({
      model: providers.groq.fast, // llama-3.1-8b-instant (free tier)
      prompt: `Translate the following text to ${targetLang}. Return ONLY the translation, no explanations or additional text:\n\n${input.text}`,
    });
    return { success: true, translated: result.text.trim() };
  } catch (error) {
    console.error("[translateText] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    };
  }
}

/**
 * Translate multiple fields in parallel using Groq AI
 * Useful for forms with multiple bilingual fields
 */
export async function translateFields(
  input: TranslateFieldsInput
): Promise<TranslateFieldsResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  const { schoolId } = await getTenantContext();
  if (!schoolId) {
    return { success: false, error: "Missing school context" };
  }

  const targetLang = input.sourceLanguage === "en" ? "Arabic" : "English";

  try {
    const entries = Object.entries(input.fields).filter(
      ([, value]) => value && value.trim() !== ""
    );

    if (entries.length === 0) {
      return { success: true, translated: {} };
    }

    const results = await Promise.all(
      entries.map(async ([key, value]) => {
        const result = await generateText({
          model: providers.groq.fast,
          prompt: `Translate the following text to ${targetLang}. Return ONLY the translation, no explanations or additional text:\n\n${value}`,
        });
        return [key, result.text.trim()] as const;
      })
    );

    return {
      success: true,
      translated: Object.fromEntries(results),
    };
  } catch (error) {
    console.error("[translateFields] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    };
  }
}
