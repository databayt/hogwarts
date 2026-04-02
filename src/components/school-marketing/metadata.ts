// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getDisplayText } from "@/lib/content-display"

import { formatFullDomain } from "./utils"

export interface SchoolMetadataProps {
  school: any
  subdomain: string
  rootDomain: string
  locale?: string
}

export async function generateSchoolMetadata({
  school,
  subdomain,
  rootDomain,
  locale,
}: SchoolMetadataProps): Promise<Metadata> {
  const fullDomain = formatFullDomain(subdomain, rootDomain)

  let displayName = school.name
  if (locale) {
    const displayLang = locale as "ar" | "en"
    if (displayLang === "en" && school.nameEn) {
      displayName = school.nameEn
    } else if (displayLang !== (school.preferredLanguage || "ar")) {
      const contentLang = (school.preferredLanguage || "ar") as "ar" | "en"
      displayName =
        (await getDisplayText(
          school.name,
          contentLang,
          displayLang,
          school.id
        )) || school.name
    }
  }

  return {
    title: `${displayName} | ${fullDomain}`,
    description: `Welcome to ${displayName} - Your school management portal`,
    openGraph: {
      title: `${displayName} | ${fullDomain}`,
      description: `Welcome to ${displayName} - Your school management portal`,
      url: `https://${fullDomain}`,
      siteName: displayName,
    },
  }
}

export function generateDefaultMetadata(rootDomain: string): Metadata {
  return {
    title: rootDomain,
  }
}
