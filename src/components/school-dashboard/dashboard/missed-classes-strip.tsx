// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { listMissedClasses } from "@/components/school-dashboard/live/makeup-core"

/**
 * One compact line on a teacher's (or an admin's) dashboard: how many classes
 * were missed in the last 14 days and still have no make-up, with a way to the
 * /live shelf where they are made up.
 *
 * Renders nothing for anyone else, when nothing is missed, and when a read
 * fails — a strip that is only ever good news to act on must never be an error
 * box. Mounted in its own Suspense boundary above the day's timetable.
 */
export async function MissedClassesStrip({ locale }: { locale: string }) {
  let missed = 0
  let labels: { line: string; link: string } | null = null

  try {
    const session = await auth()
    const role = (session?.user?.role || "").toUpperCase()
    const userId = session?.user?.id
    if ((role !== "TEACHER" && role !== "ADMIN") || !userId) return null

    const { schoolId } = await getTenantContext()
    if (!schoolId) return null

    const [rows, dictionary] = await Promise.all([
      listMissedClasses(
        { userId, role: role as "TEACHER" | "ADMIN", schoolId },
        { days: 14 }
      ),
      getDictionary(locale as Locale),
    ])
    const makeup = dictionary.liveClasses?.makeup
    if (rows.length === 0 || !makeup) return null
    missed = rows.length
    labels = { line: makeup.stripLine, link: makeup.stripLink }
  } catch (error) {
    console.error("[MissedClassesStrip] Could not read missed classes:", error)
    return null
  }

  if (!labels) return null

  return (
    // Ordered like the day's timetable it sits above: a full row from `md` up.
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-2xl p-3 md:order-last md:col-span-full">
      <p className="text-sm font-medium">
        {labels.line.replace("{n}", String(missed))}
      </p>
      <Link
        href={`/${locale}/live`}
        className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
      >
        {labels.link}
      </Link>
    </div>
  )
}
