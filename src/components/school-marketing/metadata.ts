// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

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

  // school.name is always Arabic, school.nameEn is English — pick by locale
  let displayName = school.name
  if (locale === "en" && school.nameEn) {
    displayName = school.nameEn
  }

  return {
    title: displayName,
    description: `Welcome to ${displayName} - Your school management portal`,
    openGraph: {
      title: displayName,
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
