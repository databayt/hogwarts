// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getText } from "@/components/translation/display"

interface SchoolNameFields {
  id: string
  name: string
  nameEn?: string | null
  preferredLanguage?: string
}

/**
 * The school's name as it should read in the current locale.
 *
 * `name` holds the school's own language (Arabic by default); `nameEn` is the
 * English name when the school supplied one. Anything else falls through to
 * on-demand translation.
 *
 * Server-only: `getText` reaches the database, so this cannot be called from a
 * client component -- resolve it in the layout and pass the string down.
 */
export async function resolveSchoolDisplayName(
  school: SchoolNameFields,
  locale: string
): Promise<string> {
  const contentLang = (school.preferredLanguage || "ar") as "ar" | "en"
  const displayLang = locale as "ar" | "en"

  if (displayLang === "ar") return school.name
  if (displayLang === "en" && school.nameEn) return school.nameEn

  return getText(school.name, contentLang, displayLang, school.id)
}
