// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Read on the server only (features/content.tsx): the grid's client shell gets
// each card's rendered icon, never this table.

// Clean 512×512 icon set served locally from `public/feature/`.
// NOTE: do NOT route these through asset()/the CDN — the flat CDN namespace
// (cdn.databayt.org/hogwarts/<file>) serves PHOTOS for some of these names
// (events = a sack-race photo, transport = a train, library = a girl reading),
// because /illustrations/* and /photos/* collide once flattened. The local
// `/feature/` directory holds the correct icon for each. Only features with a
// matching clean icon are listed; the rest use the category fallback.
export const FEATURE_IMAGES: Record<string, string> = {
  // Core
  admission: "/feature/id-card-1.png",
  student: "/feature/student.png",
  faculty: "/feature/teacher.png",
  financial: "/feature/fees.png",
  exam: "/feature/exam.png",
  // Essential
  application: "/feature/human-resource.png",
  assignment: "/feature/assigment.png",
  attendance: "/feature/attendance.png",
  classroom: "/feature/blackboard.png",
  gradebook: "/feature/gradebook.png",
  "leave-request": "/feature/calendar-silhouette.png",
  timetable: "/feature/timetable.png",
  timesheet: "/feature/checklist.png",
  // Advance
  dashboard: "/feature/dashboards.png",
  documents: "/feature/files.png",
  reporting: "/feature/certificate-2.png",
  events: "/feature/events.png",
  library: "/feature/library.png",
  "live-classroom": "/feature/streaming.png", // "Conference"
  "mobile-application": "/feature/app-store.png",
  // Finance
  payment: "/feature/fees.png",
  accounting: "/feature/invoicing.png",
  invoice: "/feature/receipt.png",
  expense: "/feature/calculator.png",
  payroll: "/feature/payroll.png",
  sales: "/feature/money.png",
  "automated-marketing": "/feature/poll.png", // "Marketing"
  // Management
  canteen: "/feature/canteen.png",
  campus: "/feature/college.png",
  "parent-login": "/feature/parent.png",
  placement: "/feature/offer.png",
  transportation: "/feature/transport.png",
  // Communication
  announcement: "/feature/notifications.png",
  discussion: "/feature/messaging.png", // "Message"
  "notice-board": "/feature/notifications.png",
  "online-appointment": "/feature/calendar-2.png", // "Appointment"
  transcript: "/feature/id-cards.png",
  // E-Learning
  "e-learning": "/feature/video.png",
  qbank: "/feature/reading-book.png",
  // Integration
  "google-meet": "/feature/meet.png",
  "microsoft-teams": "/feature/teams.png",
  zoom: "/feature/zoom.png",
  "whatsapp-integration": "/feature/phone.png", // "WhatsApp"
  // AI — the same filled robot mark the chatbot FAB/avatar uses
  // (public/illustrations/robot-fill.png), copied into /feature/ so the grid
  // keeps serving icons locally instead of through the flat CDN namespace.
  "ai-powered": "/feature/robot-fill.png",
}

// Full-color brand marks. The monochrome glyphs are inverted in dark mode so
// they stay visible on a dark card; doing that to a brand logo mangles its
// colors, so these opt out of the dark filters entirely.
export const COLOR_ICONS = new Set<string>(["google-meet"])

// Icons whose artwork reads visually heavier than the rest — rendered one
// step smaller (28px vs the default 32px) so the grid looks balanced.
export const SMALLER_ICONS = new Set<string>([
  "admission",
  "timetable",
  "e-learning",
  "discussion", // "Message"
  "transportation",
])
