// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  /** Drill-down pages get a compact hero (smaller h1, no lead) */
  variant?: "full" | "compact"
  /** Override the title (used by drill pages to show "Textbooks" / "Mock Exams" / etc.) */
  title?: string
}

export function CommunityHero({ dictionary, variant = "full", title }: Props) {
  const community = dictionary?.community
  const heading = title ?? community?.title ?? "Community"

  return (
    <section className={cn("space-y-3", variant === "full" ? "py-10" : "py-6")}>
      <h1
        className={cn(
          variant === "full"
            ? typographyVariants.pageTitle
            : "scroll-m-20 text-3xl font-extrabold tracking-tight"
        )}
      >
        {heading}
      </h1>
      {variant === "full" && community?.subtitle ? (
        <p className={cn(typographyVariants.pageDescription, "text-balance")}>
          {community.subtitle}
        </p>
      ) : null}
      {variant === "full" && community?.lead ? (
        <p className="text-muted-foreground text-base">{community.lead}</p>
      ) : null}
    </section>
  )
}
