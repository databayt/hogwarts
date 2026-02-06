"use client"

import React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { AnthropicIcons } from "@/components/icons"

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
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                {action.label}
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
