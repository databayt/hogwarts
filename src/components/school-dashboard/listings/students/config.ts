// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

/** Default gender options (English fallback) */
export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
] as const

/** Dictionary-driven gender options */
export function getGenderOptions(
  dictionary?: Dictionary["school"]["students"]
) {
  const info = dictionary?.information as Record<string, string> | undefined
  return [
    { label: info?.male || "Male", value: "male" },
    { label: info?.female || "Female", value: "female" },
  ]
}

/** Simple lang-based gender options */
export const getGenderOptionsByLang = (lang?: string) => [
  { value: "male", label: lang === "ar" ? "ذكر" : "Male" },
  { value: "female", label: lang === "ar" ? "أنثى" : "Female" },
]
