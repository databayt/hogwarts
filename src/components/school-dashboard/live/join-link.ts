// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The join link for a timetable slot — `/{lang}/live/join/{timetableId}`.
 *
 * Every surface that offers a way into a class builds its href here (the
 * timetable cell, the dashboard's Today rows and phone strip, the banner, the
 * notifications), so they cannot drift apart. The page behind it
 * (`(live-room)/live/join/[timetableId]`) decides at click time which room is
 * today's, writes it if the sweep has not, and redirects.
 *
 * Render it with a plain `<a>` (or `prefetch={false}`): a prefetch must never
 * run that page, because running it can write today's room.
 */
export function liveJoinHref(lang: string, timetableId: string): string {
  return `/${lang}/live/join/${encodeURIComponent(timetableId)}`
}
