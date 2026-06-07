import { db } from "@/lib/db"

/**
 * Builds Prisma OR conditions that match both raw field values and
 * their cached translations. This enables bilingual search — e.g.,
 * searching "Ahmed" will find "أحمد" if a translation exists.
 *
 * Performance: queries Translation (indexed), never triggers
 * Google Translate API calls.
 */
export async function search(
  searchTerm: string,
  fields: string[],
  schoolId: string,
  storageLang: string,
  displayLang: string
): Promise<Record<string, any>[]> {
  // Direct match conditions (always included)
  const directConditions = fields.map((field) => ({
    [field]: { contains: searchTerm, mode: "insensitive" as const },
  }))

  // If same language, no translation lookup needed
  if (storageLang === displayLang) {
    return directConditions
  }

  // Find source texts whose translations match the search term
  const cached = await db.translation.findMany({
    where: {
      schoolId,
      targetLanguage: displayLang,
      sourceLanguage: storageLang,
      translatedText: { contains: searchTerm, mode: "insensitive" },
    },
    select: { sourceText: true },
    take: 50,
  })

  if (cached.length === 0) {
    return directConditions
  }

  const sourceTexts = cached.map((c) => c.sourceText)

  // Add "field IN sourceTexts" conditions for each field
  const translatedConditions = fields.map((field) => ({
    [field]: { in: sourceTexts },
  }))

  return [...directConditions, ...translatedConditions]
}
