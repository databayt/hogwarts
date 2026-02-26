// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"

export interface DomainInfo {
  protocol: string
  rootDomain: string
  isLocalhost: boolean
}

export async function getCurrentDomain(): Promise<DomainInfo> {
  const headersList = await headers()
  const host = headersList.get("host") || ""

  if (host.includes("localhost")) {
    return {
      protocol: "http",
      rootDomain: "localhost:3000",
      isLocalhost: true,
    }
  }

  // Extract root domain from host (e.g., "tenant1.databayt.org" -> "databayt.org")
  const parts = host.split(".")
  if (parts.length >= 2) {
    return {
      protocol: "https",
      rootDomain: parts.slice(-2).join("."),
      isLocalhost: false,
    }
  }

  return {
    protocol: "https",
    rootDomain: host,
    isLocalhost: false,
  }
}

export function formatFullDomain(
  subdomain: string,
  rootDomain: string
): string {
  return `${subdomain}.${rootDomain}`
}

export function getBackToMainSiteUrl(
  protocol: string,
  rootDomain: string
): string {
  return `${protocol}://${rootDomain}`
}
