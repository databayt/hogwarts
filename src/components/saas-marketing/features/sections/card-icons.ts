// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Map a card title (e.g. "Attendance Management", "For Parents", "Data Security")
 * to a Lucide icon name resolvable via `getIconComponent`. Pure + server-safe so
 * Used by the `Glyph` component as the Lucide fallback when a title has no
 * matching real illustration in `card-art.ts`.
 *
 * Rules are ordered by specificity — the first keyword found in the lowercased
 * title wins, so put narrow matches ("security") before broad ones ("data").
 */
const RULES: ReadonlyArray<readonly [keyword: string, icon: string]> = [
  // Roles
  ["admin", "Settings"],
  ["teacher", "PenSquare"],
  ["faculty", "PenSquare"],
  ["parent", "Users"],
  ["student", "GraduationCap"],
  ["alumni", "Network"],
  // Security / data
  ["security", "ShieldCheck"],
  ["privacy", "Lock"],
  ["data management", "LayoutDashboard"],
  ["data", "LayoutDashboard"],
  // Admissions / records
  ["admission", "ClipboardList"],
  ["enroll", "UserPlus"],
  ["application", "ClipboardList"],
  ["record", "FileText"],
  ["document", "FileText"],
  // Academics
  ["library", "Library"],
  ["book", "BookOpen"],
  ["attendance", "CalendarCheck"],
  ["timetable", "CalendarDays"],
  ["schedule", "CalendarDays"],
  ["exam", "ScrollText"],
  ["grade", "Award"],
  ["assignment", "ClipboardCheck"],
  ["course", "BookMarked"],
  ["lesson", "BookMarked"],
  ["certificate", "Award"],
  ["report", "BarChart3"],
  ["analytic", "LineChart"],
  ["insight", "LineChart"],
  ["dashboard", "LayoutDashboard"],
  // Finance
  ["fee", "CreditCard"],
  ["payment", "CreditCard"],
  ["pay", "CreditCard"],
  ["invoice", "Receipt"],
  ["account", "Calculator"],
  ["finance", "Wallet"],
  ["expense", "Coins"],
  ["cost", "Coins"],
  ["budget", "Wallet"],
  // Operations
  ["transport", "Bus"],
  ["bus", "Bus"],
  ["hostel", "House"],
  ["residen", "House"],
  ["dormitor", "House"],
  ["canteen", "UtensilsCrossed"],
  ["cafeteria", "UtensilsCrossed"],
  ["inventory", "Warehouse"],
  ["asset", "Package"],
  ["human resource", "Briefcase"],
  ["payroll", "Banknote"],
  ["staff", "Contact"],
  // Communication
  ["communication", "MessagesSquare"],
  ["message", "MessageSquare"],
  ["chat", "MessageSquare"],
  ["email", "Mail"],
  ["mail", "Mail"],
  ["notification", "Megaphone"],
  ["announce", "Megaphone"],
  ["alert", "AlertCircle"],
  ["sms", "Smartphone"],
  ["call", "Phone"],
  // Tech / platform
  ["mobile", "Smartphone"],
  ["app", "Smartphone"],
  ["api", "Plug"],
  ["integration", "Plug"],
  ["cloud", "Cloud"],
  ["open source", "Code"],
  ["code", "Code"],
  ["biometric", "Fingerprint"],
  ["face", "ScanFace"],
  ["rfid", "ScanLine"],
  ["barcode", "ScanLine"],
  ["language", "Languages"],
  ["online", "Globe"],
  ["web", "Globe"],
  ["video", "Video"],
  ["live", "MonitorPlay"],
  ["ai", "Sparkles"],
  // Qualities / misc
  ["customiz", "Settings"],
  ["flexib", "Settings"],
  ["support", "Headphones"],
  ["help", "HelpCircle"],
  ["community", "Users"],
  ["user-friendly", "Sparkles"],
  ["friendly", "Sparkles"],
  ["intuitive", "Sparkles"],
  ["comprehensive", "Blocks"],
  ["complete", "Blocks"],
  ["vote", "Vote"],
  ["poll", "Vote"],
  ["news", "Newspaper"],
  ["blog", "Newspaper"],
  ["note", "StickyNote"],
  ["store", "ShoppingBag"],
  ["shop", "ShoppingCart"],
  ["growth", "TrendingUp"],
  ["track", "TrendingUp"],
]

const FALLBACK = "Sparkles"

/** Resolve a Lucide icon name for a card title. Always returns a valid name. */
export function iconNameForTitle(title: string): string {
  const t = title.toLowerCase()
  for (const [keyword, icon] of RULES) {
    if (t.includes(keyword)) return icon
  }
  return FALLBACK
}
