"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { AnthropicIcons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

/**
 * QuickActions Component
 * Displays a row of quick action items
 * - Icon and text in a row (horizontal layout)
 * - 4 actions taking full width with solid colored backgrounds
 * - Role-specific and reusable
 * - Uses Anthropic icons exclusively
 * - Hover tooltips with descriptions
 */

export interface QuickAction {
  iconName: string // Icon name as string (e.g., "FileText", "Users")
  label: string
  description?: string // Optional description shown on hover
  href?: string
  onClick?: () => void
}

/**
 * Android tile art per action, keyed by the action's label.
 *
 * On phones the four actions render as one row of app icons rather than two
 * rows of coloured cards, matching the home block above them: a cell-width tile
 * at a 29.2% radius, a 13px label underneath, and the same artwork lifted from
 * the Android app's `drawable-nodpi` into `public/tiles/`. A student's four —
 * Assignments, My Grades, Schedule, Messages — each get their own Android tile.
 *
 * The radius is the home block's, not Android's 14dp-on-64dp (21.9%). Seven of
 * the seventeen tiles carry a ~26% radius baked into their alpha and the other
 * ten are hard squares, so a single CSS radius above both is what makes the set
 * look like one set — and it has to be the radius the block above already uses.
 *
 * Keyed by label, not by `iconName`: the Android set is per-feature, so
 * "Grades" has a grades tile while its `iconName` is the generic `Sparkle`.
 * An action with no entry falls back to a tinted cell carrying its own icon.
 */
const tileByLabel: Record<string, string> = {
  Assignments: "assignments",
  Grades: "grades",
  "My Grades": "grades",
  Performance: "grades",
  Schedule: "schedule",
  Messages: "message",
  "Contact Teacher": "message",
  Attendance: "attendance",
  Announcements: "announcements",
  Announce: "announcements",
  Events: "events",
  Fees: "wallet",
  Finance: "wallet",
  Invoices: "wallet",
  Receipts: "wallet",
  Library: "library",
  Notifications: "notifications",
  School: "home",
  Dashboard: "home",
  Settings: "setting",
  Staff: "students",
  "My Children": "students",
  Classrooms: "students",
  Subjects: "subject",
  Reports: "exams",
}

// Card background colors (matching Quick Look section)
const cardColors = [
  { bg: "bg-[#D97757]", text: "text-background" }, // Coral/orange
  { bg: "bg-[#6A9BCC]", text: "text-background" }, // Blue
  { bg: "bg-[#CBCADB]", text: "text-background" }, // Lavender
  { bg: "bg-[#BCD1CA]", text: "text-background" }, // Mint
]

// Map icon names to Anthropic icon components
const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  // Core Anthropic icons
  Checklist: AnthropicIcons.Checklist,
  TaskList: AnthropicIcons.TaskList,
  Book: AnthropicIcons.Book,
  Briefcase: AnthropicIcons.Briefcase,
  Chat: AnthropicIcons.Chat,
  Calendar: AnthropicIcons.CalendarChart,
  CalendarDays: AnthropicIcons.CalendarChart,
  CalendarChart: AnthropicIcons.CalendarChart,
  Clock: AnthropicIcons.Stopwatch,
  Stopwatch: AnthropicIcons.Stopwatch,
  Archive: AnthropicIcons.Archive,
  FolderOpen: AnthropicIcons.Archive,
  Notebook: AnthropicIcons.Notebook,
  FileText: AnthropicIcons.Notebook,
  Pencil: AnthropicIcons.Pencil,
  Globe: AnthropicIcons.Globe,
  Lightning: AnthropicIcons.Lightning,
  Bell: AnthropicIcons.Lightning,
  Terminal: AnthropicIcons.Terminal,
  CodeWindow: AnthropicIcons.CodeWindow,
  Copy: AnthropicIcons.Copy,
  Flow: AnthropicIcons.Flow,
  ShieldCheck: AnthropicIcons.ShieldCheck,
  Announcement: AnthropicIcons.Announcement,
  Sparkle: AnthropicIcons.Sparkle,
  Gear: AnthropicIcons.Gear,
  Users: AnthropicIcons.Users,
  BarChart: AnthropicIcons.BarChart,
  // Mapped aliases
  Settings: AnthropicIcons.Gear, // Settings → Gear
  UserPlus: AnthropicIcons.Users, // Add user → Users
  BarChart3: AnthropicIcons.BarChart, // Analytics → BarChart
  TrendingUp: AnthropicIcons.BarChart, // Growth → BarChart
  CheckCircle: AnthropicIcons.Checklist, // Completion
  BookOpen: AnthropicIcons.Book, // Reading
  Award: AnthropicIcons.Sparkle, // Achievement
  MessageSquare: AnthropicIcons.Chat, // Communication
  ClipboardList: AnthropicIcons.TaskList, // Tasks
  DollarSign: AnthropicIcons.Notebook, // Finance
  Receipt: AnthropicIcons.Notebook, // Documents
  GraduationCap: AnthropicIcons.Book, // Education
  Building: AnthropicIcons.Briefcase, // Organization
  Contact: AnthropicIcons.Chat, // Contact
}

// Convert "My Grades" → "myGrades", "School" → "school"
function toCamelCase(str: string): string {
  const words = str.split(/\s+/)
  return words
    .map((w, i) =>
      i === 0
        ? w.charAt(0).toLowerCase() + w.slice(1)
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join("")
}

interface QuickActionsProps {
  actions: QuickAction[]
  locale?: string
  className?: string
}

export function QuickActions({
  actions,
  locale = "en",
  className,
}: QuickActionsProps) {
  const { dictionary } = useDictionary()
  const dict = dictionary?.school?.dashboard?.quickActionsSection as
    | Record<string, string>
    | undefined

  const visible = actions.slice(0, 4)
  const labelOf = (action: QuickAction) =>
    dict?.[toCamelCase(action.label)] || action.label

  return (
    <div className={cn("w-full", className)}>
      {/* Phones: one row of four tiles, sharing the home block's grid exactly —
          32px columns, tiles that fill their cell rather than a fixed 64px. On
          the Android home screen the 2x2 cluster beside the widget sits on the
          same column rhythm as the 4-up rows below it (`home-grid.kt`: two
          slots plus one gap equal two cells plus one gap), and that only holds
          here if this row uses the block's gap and lets the cell set the size.
          At a phone width the cell lands at ~65px, which is the Android tile's
          64dp; on a wide phone both grids grow together. */}
      <div className="grid grid-cols-4 gap-x-8 sm:hidden">
        {visible.map((action, index) => {
          const tile = tileByLabel[action.label]
          const label = labelOf(action)
          // No Android artwork for this action: tint the cell from the card
          // palette and centre the action's own icon in it, so the row keeps
          // four tiles. An empty cell would silently drop a destination the
          // role's own dashboard still lists from `sm` up.
          const Icon = iconMap[action.iconName] || AnthropicIcons.Notebook
          const color = cardColors[index % cardColors.length]

          return (
            <Link
              key={`${action.label}-${index}`}
              href={`/${locale}${action.href ?? ""}`}
              className="flex flex-col items-center gap-[5px] focus:outline-none"
            >
              {tile ? (
                <Image
                  src={`/tiles/${tile}.png`}
                  alt=""
                  width={64}
                  height={64}
                  sizes="25vw"
                  className="aspect-square w-full rounded-[29.2%] object-cover shadow-md"
                />
              ) : (
                <div
                  className={cn(
                    "flex aspect-square w-full items-center justify-center rounded-[29.2%] shadow-md",
                    color.bg
                  )}
                >
                  <Icon
                    className={cn("size-1/2", color.text)}
                    aria-hidden={true}
                  />
                </div>
              )}
              <span className="text-foreground max-w-full truncate text-[13px] leading-4 font-semibold">
                {label}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-4">
        {actions.slice(0, 4).map((action, index) => {
          // Get icon component from map, fallback to Notebook if not found
          const Icon = iconMap[action.iconName] || AnthropicIcons.Notebook
          // Cycle through colors for each card
          const color = cardColors[index % cardColors.length]

          const content = (
            <div
              className={cn("flex items-center gap-4 rounded-lg p-4", color.bg)}
            >
              <Icon
                className={cn("h-6 w-6 flex-shrink-0", color.text)}
                aria-hidden={true}
              />
              <span
                className={cn("truncate text-base font-semibold", color.text)}
              >
                {dict?.[toCamelCase(action.label)] || action.label}
              </span>
            </div>
          )

          const wrappedContent = action.href ? (
            <Link
              href={`/${locale}${action.href}`}
              className="focus-visible:ring-primary block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {content}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="focus-visible:ring-primary block w-full rounded-lg text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              type="button"
            >
              {content}
            </button>
          )

          return <div key={`${action.label}-${index}`}>{wrappedContent}</div>
        })}
      </div>
    </div>
  )
}
