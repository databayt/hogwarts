// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export type SchoolNameFields = {
  name: string | null | undefined
  nameEn?: string | null | undefined
}

export function getSchoolDisplayName(
  school: SchoolNameFields | null | undefined,
  lang: string | null | undefined
): string {
  if (!school) return ""
  if (lang === "en" && school.nameEn) return school.nameEn
  return school.name ?? school.nameEn ?? ""
}
