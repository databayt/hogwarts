// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { describe, expect, it } from "vitest"

import { buildClassIcs } from "@/components/school-dashboard/live/room/calendar-file"

const base = {
  id: "cls_1",
  title: "Family Sciences",
  url: "https://demo.balqalam.com/ar/live/cls_1",
  // 2026-09-03 10:52 UTC → 11:40 UTC
  startsAtMs: Date.UTC(2026, 8, 3, 10, 52, 0),
  endsAtMs: Date.UTC(2026, 8, 3, 11, 40, 0),
}

describe("buildClassIcs", () => {
  it("writes the instants as UTC, not as the runtime's local time", () => {
    // The whole point of going through the epoch: this has to hold whatever
    // TZ the test (or Vercel) happens to run in.
    const ics = buildClassIcs(base)
    expect(ics).toContain("DTSTART:20260903T105200Z")
    expect(ics).toContain("DTEND:20260903T114000Z")
  })

  it("keys the event on the session id so re-adding updates rather than duplicates", () => {
    expect(buildClassIcs(base)).toContain("UID:live-cls_1@balqalam")
  })

  it("escapes the delimiters a real class description contains", () => {
    const ics = buildClassIcs({
      ...base,
      description: "Taught by Ali; unit 1, lesson 2\nBring the workbook",
    })
    expect(ics).toContain(
      "DESCRIPTION:Taught by Ali\\; unit 1\\, lesson 2\\nBring the workbook"
    )
  })

  it("omits the description line when the class has nothing to say", () => {
    expect(buildClassIcs({ ...base, description: null })).not.toContain(
      "DESCRIPTION:"
    )
  })

  it("keeps Arabic intact — the summary is the subject as stored", () => {
    const ics = buildClassIcs({ ...base, title: "العلوم الأسرية" })
    expect(ics).toContain("SUMMARY:العلوم الأسرية")
  })

  it("separates lines with CRLF, which is what Outlook enforces", () => {
    const ics = buildClassIcs(base)
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0")).toBe(true)
    expect(ics.endsWith("END:VEVENT\r\nEND:VCALENDAR")).toBe(true)
    expect(ics).not.toMatch(/[^\r]\n/)
  })
})
