"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The second level of attendance navigation: a quiet pill segmented bar of
 * links (apple.com style) for the pages merged under one tab, plus an
 * optional "More" menu for the rarely used ones. Active state comes from the
 * pathname, so it works from any page in the group.
 */
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface SectionLink {
  /** Path under /[lang]/attendance, e.g. "manual" or "" for the root. */
  path: string
  label: string
  /** Mark active on these extra paths too. */
  also?: string[]
}

interface SectionNavProps {
  links: SectionLink[]
  more?: SectionLink[]
  moreLabel?: string
  className?: string
}

export function SectionNav({
  links,
  more = [],
  moreLabel = "More",
  className,
}: SectionNavProps) {
  const { lang } = useParams<{ lang: string }>()
  const pathname = usePathname().replace(/\/$/, "")
  const base = `/${lang}/attendance`
  const href = (p: string) => (p ? `${base}/${p}` : base)
  // Longest matching path wins, so "interventions/tiers" doesn't also
  // light up "interventions".
  const matchLen = (l: SectionLink) =>
    Math.max(
      -1,
      ...[l.path, ...(l.also ?? [])].map((p) => {
        const h = href(p)
        return pathname === h || (p !== "" && pathname.startsWith(h + "/"))
          ? h.length
          : -1
      })
    )
  const all = [...links, ...more]
  const best = all.reduce<SectionLink | null>(
    (a, l) => (matchLen(l) > (a ? matchLen(a) : -1) ? l : a),
    null
  )
  const isActive = (l: SectionLink) => best?.path === l.path
  const moreActive = more.find(isActive)

  return (
    <nav
      className={cn(
        "bg-muted inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-0.5",
        className
      )}
    >
      {links.map((l) => (
        <Link
          key={l.path}
          href={href(l.path)}
          aria-current={isActive(l) ? "page" : undefined}
          className={cn(
            "text-muted-foreground rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all",
            "hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            isActive(l) && "bg-background text-foreground shadow-sm"
          )}
        >
          {l.label}
        </Link>
      ))}
      {more.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "text-muted-foreground flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap",
              "hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              moreActive && "bg-background text-foreground shadow-sm"
            )}
          >
            {moreActive?.label ?? moreLabel}
            <ChevronDown className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {more.map((l) => (
              <DropdownMenuItem key={l.path} asChild>
                <Link href={href(l.path)}>{l.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </nav>
  )
}

/** Merged-section definitions, so every page in a group renders the same bar. */
export type SectionGroup = "take" | "excuses" | "risk" | "reports"

export function useSectionLinks(
  group: SectionGroup,
  t: Record<string, Record<string, string>> | undefined
): { links: SectionLink[]; more: SectionLink[]; moreLabel: string } {
  const s = t?.[group] ?? {}
  switch (group) {
    case "take":
      return {
        links: [
          { path: "manual", label: s.manual ?? "Class list" },
          { path: "qr-code", label: s.qr ?? "QR code" },
          { path: "barcode", label: s.barcode ?? "ID cards" },
        ],
        more: [
          { path: "kiosk", label: s.kiosk ?? "Self check-in kiosk" },
          { path: "bulk-upload", label: s.upload ?? "Upload a file" },
          { path: "hall-pass", label: s.hallPass ?? "Hall passes" },
        ],
        moreLabel: s.more ?? "More",
      }
    case "excuses":
      return {
        links: [
          { path: "excuses", label: s.excuses ?? "Excuses" },
          { path: "intentions", label: s.intentions ?? "Planned absences" },
        ],
        more: [],
        moreLabel: "",
      }
    case "risk":
      return {
        links: [
          { path: "early-warning", label: s.list ?? "Students" },
          { path: "interventions", label: s.interventions ?? "Interventions" },
          { path: "letters", label: s.letters ?? "Letters" },
        ],
        more: [
          { path: "interventions/tiers", label: s.tiers ?? "Support tiers" },
          { path: "ai", label: s.ai ?? "Predictions" },
          { path: "gamification", label: s.gamification ?? "Rewards" },
        ],
        moreLabel: s.more ?? "More",
      }
    case "reports":
      return {
        links: [
          { path: "analytics", label: s.overview ?? "Overview" },
          { path: "reports", label: s.records ?? "Records" },
          { path: "recent", label: s.recent ?? "Activity" },
        ],
        more: [],
        moreLabel: "",
      }
  }
}

/** Drop-in bar for a page: `<AttendanceSectionNav group="take" />`. */
export function AttendanceSectionNav({
  group,
  dictionary,
  className,
}: {
  group: SectionGroup
  dictionary?: any
  className?: string
}) {
  const { dictionary: ctx } = useDictionary()
  const t = (dictionary ?? (ctx as any))?.attendanceHub?.sections
  const { links, more, moreLabel } = useSectionLinks(group, t)
  return (
    <SectionNav
      links={links}
      more={more}
      moreLabel={moreLabel}
      className={className}
    />
  )
}
