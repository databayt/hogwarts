// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The one school shape the mobile app picks a school from. Shared by
 * `GET /api/mobile/schools` and the social-login `needs_school` response so
 * the two can never drift apart.
 */
export const schoolDirectorySelect = {
  id: true,
  name: true,
  nameEn: true,
  logoUrl: true,
  domain: true,
} as const

export interface SchoolDirectoryRow {
  id: string
  name: string
  nameEn: string | null
  logoUrl: string | null
  domain: string
}

export function toSchoolDirectoryDto(school: SchoolDirectoryRow) {
  return {
    id: school.id,
    name: school.name,
    name_en: school.nameEn,
    logo_url: school.logoUrl,
    domain: school.domain,
  }
}
