// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The class as a calendar event.
 *
 * This is what the reference's `+ ADD` becomes here. There it adds a show to
 * Up Next, a queue of things you might watch; a student does not choose
 * whether to attend their own class, so a watchlist would be a control that
 * changes nothing. The nearest thing the button can honestly do is put the
 * class in the reader's own calendar, which is a real answer to "I do not want
 * to miss this".
 *
 * Built and downloaded in the BROWSER rather than served from a route: every
 * field is already on the card, so a round trip would buy nothing, and an
 * `.ics` endpoint is one more authenticated surface to get the tenant scoping
 * right on.
 */

/** RFC 5545 §3.3.5: UTC, no separators. Off the epoch, so the school's zone
 *  and the reader's are both irrelevant — the instant is the instant. */
function stamp(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")
}

/** RFC 5545 §3.3.11: backslash, semicolon and comma are delimiters inside a
 *  value, and a newline has to become a literal `\n`. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

export interface ClassCalendarEvent {
  /** The session id — becomes the UID, so re-adding the same class UPDATES
   *  the calendar entry rather than duplicating it. */
  id: string
  title: string
  description?: string | null
  /** Absolute URL back to the class. */
  url: string
  startsAtMs: number
  endsAtMs: number
}

export function buildClassIcs(event: ClassCalendarEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//databayt//balqalam live class//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:live-${event.id}@balqalam`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(event.startsAtMs)}`,
    `DTEND:${stamp(event.endsAtMs)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `URL:${escapeText(event.url)}`,
  ]
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  }
  lines.push("END:VEVENT", "END:VCALENDAR")
  // CRLF, not LF: RFC 5545 §3.1, and Outlook is the one that enforces it.
  return lines.join("\r\n")
}

/** Hand the file to the browser. A no-op anywhere `document` is absent. */
export function downloadClassIcs(event: ClassCalendarEvent, filename: string) {
  const blob = new Blob([buildClassIcs(event)], {
    type: "text/calendar;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Freed on the next tick — revoking synchronously races the download in
  // Safari, which has not finished reading the blob when `click` returns.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
