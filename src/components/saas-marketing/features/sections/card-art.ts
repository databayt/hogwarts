// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Map a card title (e.g. "Attendance Management", "For Parents") to one of the
 * real flat-glyph illustrations in `public/feature/` — the same clean icon set
 * the features landing grid uses, so detail pages share its visual language.
 *
 * Pure + server-safe. Ordered by specificity (first keyword found wins). Only
 * names verified to exist on disk are mapped; an unmatched title returns null
 * and the caller falls back to a bare Lucide icon.
 */
const RULES: ReadonlyArray<readonly [keyword: string, src: string]> = [
  // Roles
  ["admin", "/feature/role-based.png"],
  ["teacher", "/feature/teacher.png"],
  ["faculty", "/feature/teacher.png"],
  ["parent", "/feature/parent.png"],
  ["student", "/feature/student.png"],
  ["alumni", "/feature/offer.png"],
  // Records / admissions
  ["data management", "/feature/dashboards.png"],
  ["admission", "/feature/id-card-1.png"],
  ["enroll", "/feature/id-card-1.png"],
  ["application", "/feature/human-resource.png"],
  ["transcript", "/feature/id-cards.png"],
  ["document", "/feature/files.png"],
  ["record", "/feature/files.png"],
  // Academics
  ["library", "/feature/library.png"],
  ["book", "/feature/reading-book.png"],
  ["attendance", "/feature/attendance.png"],
  ["timetable", "/feature/timetable.png"],
  ["schedule", "/feature/timetable.png"],
  ["exam", "/feature/exam.png"],
  ["assignment", "/feature/assigment.png"],
  ["grade", "/feature/gradebook.png"],
  ["classroom", "/feature/blackboard.png"],
  ["lesson", "/feature/blackboard.png"],
  ["certificate", "/feature/certificate-2.png"],
  ["report", "/feature/certificate-2.png"],
  ["dashboard", "/feature/dashboards.png"],
  ["analytic", "/feature/dashboards.png"],
  // Finance
  ["fee", "/feature/fees.png"],
  ["payment", "/feature/fees.png"],
  ["invoice", "/feature/invoicing.png"],
  ["account", "/feature/invoicing.png"],
  ["expense", "/feature/calculator.png"],
  ["payroll", "/feature/payroll.png"],
  ["sales", "/feature/money.png"],
  ["receipt", "/feature/receipt.png"],
  // Operations
  ["transport", "/feature/transport.png"],
  ["hostel", "/feature/college.png"],
  ["campus", "/feature/college.png"],
  ["canteen", "/feature/canteen.png"],
  ["event", "/feature/events.png"],
  ["placement", "/feature/offer.png"],
  ["recruit", "/feature/offer.png"],
  ["human resource", "/feature/human-resource.png"],
  // Communication
  ["communication", "/feature/messaging.png"],
  ["message", "/feature/messaging.png"],
  ["chat", "/feature/messaging.png"],
  ["email", "/feature/email.png"],
  ["mail", "/feature/email.png"],
  ["notification", "/feature/notifications.png"],
  ["announce", "/feature/notifications.png"],
  ["alert", "/feature/early-warning.png"],
  ["appointment", "/feature/calendar-2.png"],
  ["call", "/feature/phone.png"],
  // Tech / platform
  ["mobile", "/feature/app-store.png"],
  ["app", "/feature/app-store.png"],
  ["video", "/feature/video.png"],
  ["live", "/feature/streaming.png"],
  ["conference", "/feature/streaming.png"],
  ["meet", "/feature/meet.png"],
  ["zoom", "/feature/zoom.png"],
  ["teams", "/feature/teams.png"],
  ["whatsapp", "/feature/phone.png"],
  ["ai", "/feature/robot.png"],
  ["support", "/feature/headphone.png"],
  ["help", "/feature/headphone.png"],
  ["login", "/feature/login.png"],
  ["security", "/feature/role-based.png"],
  ["poll", "/feature/poll.png"],
  ["vote", "/feature/poll.png"],
  ["survey", "/feature/poll.png"],
]

/** Resolve a real glyph path for a card title, or null to fall back to Lucide. */
export function artForTitle(title: string): string | null {
  const t = title.toLowerCase()
  for (const [keyword, src] of RULES) {
    if (t.includes(keyword)) return src
  }
  return null
}
