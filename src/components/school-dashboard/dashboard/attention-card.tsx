"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { reasonChip } from "@/components/school-dashboard/school/readiness/labels"
import {
  membershipLink,
  type AttentionMember,
} from "@/components/school-dashboard/school/readiness/overview"

export interface AttentionCardProps {
  members: AttentionMember[]
  locale: string
  className?: string
}

/**
 * "Needs follow-up": the members whose readiness is bad or warn, each with the
 * reason in words and a link into the membership lane filtered to them.
 */
export function AttentionCard({ members, locale, className }: AttentionCardProps) {
  const { dictionary } = useDictionary()
  const t = (dictionary?.school?.dashboard?.readiness ?? {}) as Record<
    string,
    string
  >

  return (
    <Card className={cn("bg-muted border-none shadow-none", className)}>
      <CardHeader>
        <CardTitle>{t.attentionTitle || "Needs follow-up"}</CardTitle>
        <CardDescription>{t.attentionDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {t.attentionEmpty || "Everyone is ready"}
          </p>
        ) : (
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.userId}>
                <Link
                  href={membershipLink(locale, m)}
                  className="hover:bg-background/60 flex flex-col gap-1.5 rounded-md px-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {m.role === "TEACHER"
                        ? t.roleTeacher || "Teacher"
                        : m.sectionName || t.roleStudent || "Student"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <Badge
                      variant={m.level === "bad" ? "destructive" : "secondary"}
                    >
                      {m.level === "bad"
                        ? t.levelBad || "Urgent"
                        : t.levelWarn || "Warning"}
                    </Badge>
                    {m.reasons.map((r) => (
                      <span
                        key={r}
                        className="bg-background rounded-full px-2 py-0.5 text-xs"
                      >
                        {reasonChip(r, locale)}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
