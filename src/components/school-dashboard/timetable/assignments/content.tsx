// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getAssignmentBoard } from "./actions"
import { AssignmentBoard } from "./board"

/**
 * /timetable/teachers — who teaches which subject in which section.
 *
 * The edge lets TEACHER into /timetable/*, so this page checks for admin
 * itself: `getAssignmentBoard` refuses anyone who can't modify the timetable,
 * and the page says so instead of rendering an empty board.
 */
export default async function AssignmentsContent({ lang }: { lang: Locale }) {
  const [dictionary, board] = await Promise.all([
    getDictionary(lang),
    getAssignmentBoard(),
  ])
  const t = dictionary?.school?.timetable?.assignments as
    | Record<string, string>
    | undefined

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {t?.title ?? "Assign teachers"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t?.description ??
            "Each cell is a subject in a section. Choose who teaches it and the timetable follows."}
        </p>
      </div>
      {board.success && board.data ? (
        <AssignmentBoard data={board.data} />
      ) : (
        <p className="text-muted-foreground text-sm">
          {board.error === "UNAUTHORIZED" || board.error === "NOT_AUTHENTICATED"
            ? (t?.unauthorized ?? "Only school admins can assign teachers.")
            : ((dictionary?.common as { errors?: Record<string, string> })
                ?.errors?.[board.error ?? ""] ?? board.error)}
        </p>
      )}
    </div>
  )
}
