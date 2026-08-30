// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { MarketingConfig, SiteConfig } from "./types"

export const siteConfig: SiteConfig = {
  name: "balqalam",
  description:
    "An open source application built using the new router, server components and everything new in Next.js 13.",
  url: "https://ed.databayt.org",
  ogImage: "https://tx.shadcn.com/og.jpg",
  links: {
    // The "Built by Databayt" byline in the footer points here. It used to
    // carry the starter template's `twitter.com/shadcn` — someone else's
    // account, rendered on every marketing page. databayt.org is the same
    // destination the tenant school-marketing footer already attributes to.
    site: "https://databayt.org",
    github: "https://github.com/databayt/hogwarts",
  },
}

export const marketingConfig: MarketingConfig = {
  mainNav: [
    {
      title: "Features",
      href: "/features",
    },

    {
      title: "Community",
      href: "/community",
    },

    {
      title: "Pricing",
      href: "/pricing",
    },

    {
      title: "Documentation",
      href: "/docs",
    },
  ],
}
