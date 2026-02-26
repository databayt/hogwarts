// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { MetadataRoute } from "next"

import { siteConfig } from "@/components/table/config/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [""].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date().toISOString(),
  }))

  return [...routes]
}
