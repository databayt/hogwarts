import { MarketingConfig, SiteConfig } from "./types"

export const siteConfig: SiteConfig = {
  name: "Hogwarts",
  description:
    "An open source application built using the new router, server components and everything new in Next.js 13.",
  url: "https://ed.databayt.org",
  ogImage: "https://tx.shadcn.com/og.jpg",
  links: {
    twitter: "https://twitter.com/shadcn",
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
      title: "Blog",
      href: "/blog",
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
