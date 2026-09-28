"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "./print.css"

import { Suspense } from "react"
import { useParams } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { RoleRouter } from "./views"
import { TimetableSurfaceSkeleton } from "./views/grid-skeleton"
import type { InitialTimetable } from "./views/role-router"

interface Props {
  dictionary?: Dictionary["school"]
  defaultTab?: "today" | "full"
  /** Session-derived: will this reader land on `StudentView`? Shapes the
   *  loading placeholder, which renders before any role is knowable client-side. */
  studentShell?: boolean
  /** The term + personalized data, started on the server by the page and
   *  streamed in; without it the router loads them itself after mounting. */
  initialData?: Promise<InitialTimetable | null>
}

function TimetableContentInner({
  dictionary,
  defaultTab,
  studentShell,
  initialData,
}: Props) {
  const params = useParams()
  const lang = (params?.lang as Locale) || "en"

  return (
    <div className="space-y-6">
      {dictionary && (
        <Suspense
          fallback={<TimetableSurfaceSkeleton studentShell={studentShell} />}
        >
          <RoleRouter
            dictionary={dictionary}
            lang={lang}
            defaultTab={defaultTab}
            studentShell={studentShell}
            initialData={initialData}
          />
        </Suspense>
      )}
    </div>
  )
}

// No SessionProvider here: nothing under the timetable reads useSession, and
// the root layout already provides the server-resolved session. The nested
// provider had no `session` prop, so it fetched /api/auth/session on every
// visit and shadowed the root one.
export const TimetableContent = TimetableContentInner
