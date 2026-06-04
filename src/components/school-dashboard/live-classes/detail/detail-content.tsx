// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { typography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLiveClass } from "@/components/school-dashboard/live-classes/actions/sessions"

interface Props {
  id: string
  locale: string
  dictionary: Dictionary
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

export async function LiveClassDetailContent({
  id,
  locale,
  dictionary,
}: Props) {
  const result = await getLiveClass(id)
  if (!("success" in result) || !result.success) {
    notFound()
  }
  const session = result.data

  const t = dictionary?.liveClasses

  const canJoin = session.status === "live" || session.status === "scheduled"

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={typography.h2}>{session.title}</h1>
          <p className={typography.muted}>
            {formatWhen(session.scheduledStart, locale)} —{" "}
            {formatWhen(session.scheduledEnd, locale)}
          </p>
        </div>
        <Badge>{t?.status?.[session.status] ?? session.status}</Badge>
      </div>

      {session.description && (
        <p className={typography.p}>{session.description}</p>
      )}

      <dl className="grid grid-cols-2 gap-4 text-sm">
        {session.section && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.section ?? "Section"}
            </dt>
            <dd>{session.section.name}</dd>
          </div>
        )}
        {session.subject && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.subject ?? "Subject"}
            </dt>
            <dd>{session.subject.name}</dd>
          </div>
        )}
        {session.teacher && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.teacher ?? "Teacher"}
            </dt>
            <dd>
              {session.teacher.firstName} {session.teacher.lastName}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">
            {t?.labels?.recording ?? "Recording"}
          </dt>
          <dd>
            {session.recordingEnabled
              ? (t?.labels?.enabled ?? "Enabled")
              : (t?.labels?.disabled ?? "Disabled")}
          </dd>
        </div>
      </dl>

      <div className="flex gap-2">
        {/* External sessions open their meeting link directly; LiveKit uses the in-app room. */}
        {canJoin && session.provider === "external" && session.meetingUrl && (
          <Button asChild>
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t?.actions?.join ?? "Join"}
            </a>
          </Button>
        )}
        {canJoin && session.provider === "livekit" && (
          <Button asChild>
            <Link href={`/${locale}/live-classes/${session.id}/room`}>
              {t?.actions?.join ?? "Join"}
            </Link>
          </Button>
        )}
        {session.status === "ended" && (
          <Button asChild variant="outline">
            <Link href={`/${locale}/live-classes/${session.id}/recordings`}>
              {t?.actions?.viewRecordings ?? "View recordings"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
