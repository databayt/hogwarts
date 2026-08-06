// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { resolveSchoolDisplayName } from "@/components/template/site-header/display-name"

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

  // Same resolver the nav uses: `name` is the school's own language, `nameEn`
  // the English name when supplied, otherwise on-demand translation. Without
  // this the tab title stayed Arabic on /en for any school with no `nameEn`.
  const displayName = await resolveSchoolDisplayName(school, locale ?? "ar")

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
