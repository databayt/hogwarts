// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { auth } from "@/auth"
import { Radio } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"

import { getLiveSessionsForLesson, resolveViewerSectionScope } from "./queries"

/**
 * "This lesson is being taught live right now — join." Rendered above a lumos
 * lesson when a conference session references it today.
 *
 * Server Component: it does its own scoped read and renders nothing when there
 * is nothing to say, so the lesson page pays one indexed query (on
 * `catalogLessonId`) and no layout shift. Section-scoped exactly like the
 * conference list reads — a student never sees another section's room.
 */
export async function LessonLiveStrip({
  schoolId,
  catalogLessonId,
  lang,
  labels,
}: {
  schoolId: string | null
  catalogLessonId: string
  lang: Locale
  labels: { liveNow: string; upcoming: string; join: string; open: string }
}) {
  if (!schoolId) return null
  let sessions: Awaited<ReturnType<typeof getLiveSessionsForLesson>> = []
  try {
    const session = await auth()
    const scope = await resolveViewerSectionScope(
      schoolId,
      session?.user?.id,
      session?.user?.role
    )
    // Staff see every section; a student/guardian only their own. A viewer
    // with no placement sees nothing rather than everything.
    if (scope === "none") return null
    sessions = await getLiveSessionsForLesson(schoolId, catalogLessonId, {
      sectionIds: scope === "all" ? undefined : scope.sectionIds,
    })
  } catch {
    // Decoration only — a failed read must never take the lesson down.
    return null
  }
  if (sessions.length === 0) return null

  const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <ul className="space-y-2">
      {sessions.map((s) => {
        const isLive = s.status === "live"
        return (
          <li
            key={s.id}
            className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm"
          >
            <Radio
              className={
                isLive ? "text-destructive h-4 w-4 animate-pulse" : "h-4 w-4"
              }
            />
            <span className="font-medium">
              {isLive ? labels.liveNow : labels.upcoming}
            </span>
            <span className="text-muted-foreground min-w-0 flex-1 truncate">
              {s.title}
              {s.sectionName ? ` · ${s.sectionName}` : ""}
              {!isLive ? ` · ${fmt.format(s.scheduledStart)}` : ""}
            </span>
            <Link
              className={buttonVariants({
                size: "sm",
                variant: isLive ? "default" : "outline",
              })}
              // The detail page owns the provider-aware Join (in-app room vs
              // vendor link) — one place, not a second copy here.
              href={`/${lang}/conference/${s.id}`}
            >
              {isLive ? labels.join : labels.open}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
