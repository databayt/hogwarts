// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { formatFullDomain } from "./utils"

export interface SchoolMetadataProps {
  school: any
  subdomain: string
  rootDomain: string
}

export function generateSchoolMetadata({
  school,
  subdomain,
  rootDomain,
}: SchoolMetadataProps): Metadata {
  const fullDomain = formatFullDomain(subdomain, rootDomain)

  return {
    title: `${school.name} | ${fullDomain}`,
    description: `Welcome to ${school.name} - Your school management portal`,
    openGraph: {
      title: `${school.name} | ${fullDomain}`,
      description: `Welcome to ${school.name} - Your school management portal`,
      url: `https://${fullDomain}`,
      siteName: school.name,
    },
  }
}

export function generateDefaultMetadata(rootDomain: string): Metadata {
  return {
    title: rootDomain,
  }
}
