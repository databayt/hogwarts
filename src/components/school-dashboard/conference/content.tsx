// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { typography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { listLiveClasses } from "./actions/sessions"
import { LiveClassesEmptyState } from "./empty-state"

interface Props {
  locale: string
  subdomain: string
  dictionary: Dictionary
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  scheduled: "secondary",
  live: "default",
  ended: "outline",
  cancelled: "outline",
  failed: "destructive",
}

function formatWhen(d: Date | string, locale: string): string {
  const date = typeof d === "string" ? new Date(d) : d
  try {
    return date.toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return date.toISOString()
  }
}

export async function LiveClassesOverviewContent({
  locale,
  dictionary,
}: Props) {
  const t = dictionary?.liveClasses

  const result = await listLiveClasses()
  const sessions = "success" in result && result.success ? result.data : []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={typography.h2}>{t?.title ?? "Live classes"}</h1>
          <p className={typography.muted}>
            {t?.subtitle ??
              "Schedule, join, and review recorded video conferencing sessions."}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/live-classes/schedule`}>
            {t?.actions?.schedule ?? "Schedule"}
          </Link>
        </Button>
      </div>

      {sessions.length === 0 ? (
        <LiveClassesEmptyState dictionary={dictionary} />
      ) : (
        <div className="divide-y rounded-md border">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/${locale}/live-classes/${s.id}`}
              className="hover:bg-muted/50 grid grid-cols-1 gap-2 px-4 py-3 transition-colors sm:grid-cols-12 sm:items-center"
            >
              <div className="sm:col-span-5">
                <p className="font-medium">{s.title}</p>
                {s.section && (
                  <p className="text-muted-foreground text-sm">
                    {s.section.name}
                    {s.subject ? ` · ${s.subject.name}` : ""}
                  </p>
                )}
              </div>
              <div className="text-muted-foreground text-sm sm:col-span-4">
                {formatWhen(s.scheduledStart, locale)}
              </div>
              <div className="sm:col-span-2">
                <Badge variant={STATUS_VARIANT[s.status] ?? "secondary"}>
                  {t?.status?.[s.status] ?? s.status}
                </Badge>
              </div>
              <div className="text-muted-foreground text-sm sm:col-span-1 sm:text-end">
                {s._count?.participants ?? 0}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
