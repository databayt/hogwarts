// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import type { Locale } from "@/components/internationalization/config"

import type { OverviewTerm } from "../lib/overview"

type TermCopy = { termLabel: string; termWithYear: string }

export function termTitle(term: OverviewTerm, t: TermCopy) {
  const template = term.yearName ? t.termWithYear : t.termLabel
  return template
    .replace("{year}", term.yearName ?? "")
    .replace("{number}", String(term.termNumber))
}

/** Segmented term switch — a link per term, so the choice lives in the URL. */
export function TermPills({
  terms,
  currentId,
  lang,
  t,
}: {
  terms: OverviewTerm[]
  currentId: string
  lang: Locale
  t: TermCopy
}) {
  if (terms.length < 2) return null
  return (
    <nav className="bg-muted inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1">
      {terms.map((term) => (
        <Link
          key={term.id}
          href={`/${lang}/grades?termId=${term.id}`}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
            term.id === currentId
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {termTitle(term, t)}
        </Link>
      ))}
    </nav>
  )
}
