"use client";

import React from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { AnthropicIcons } from "@/components/icons/anthropic";
import Link from "next/link";

/**
 * QuickActions Component
 * Displays a row of quick action items
 * - Icon and text in a row (horizontal layout)
 * - 4 actions taking full width
 * - Role-specific and reusable
 * - Uses Anthropic icons where available
 */

export interface QuickAction {
  iconName: string; // Icon name as string (e.g., "FileText", "Users")
  label: string;
  href?: string;
  onClick?: () => void;
}

// Map icon names to icon components (Anthropic icons preferred, Lucide fallback)
const iconMap: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  // Anthropic icons
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
  // Lucide fallbacks for icons without Anthropic equivalents
  Users: LucideIcons.Users,
  CheckCircle: LucideIcons.CheckCircle,
  BookOpen: LucideIcons.BookOpen,
  Award: LucideIcons.Award,
  MessageSquare: LucideIcons.MessageSquare,
  ClipboardList: LucideIcons.ClipboardList,
  DollarSign: LucideIcons.DollarSign,
  Settings: LucideIcons.Settings,
  UserPlus: LucideIcons.UserPlus,
  BarChart3: LucideIcons.BarChart3,
  Receipt: LucideIcons.Receipt,
  GraduationCap: LucideIcons.GraduationCap,
  TrendingUp: LucideIcons.TrendingUp,
  Building: LucideIcons.Building,
  Contact: LucideIcons.Contact,
};

interface QuickActionsProps {
  actions: QuickAction[];
  locale?: string;
  className?: string;
}

export function QuickActions({ actions, locale = "en", className }: QuickActionsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.slice(0, 4).map((action, index) => {
          // Get icon component from map, fallback to FileText if not found
          const Icon = iconMap[action.iconName] || LucideIcons.FileText;

          const content = (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors hover:bg-muted/50">
              <div className="flex-shrink-0 rounded-md bg-muted p-2">
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden={true} />
              </div>
              <span className="text-sm font-medium truncate">{action.label}</span>
            </div>
          );

          if (action.href) {
            return (
              <Link
                key={`${action.label}-${index}`}
                href={`/${locale}${action.href}`}
                className="block"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={`${action.label}-${index}`}
              onClick={action.onClick}
              className="block w-full text-left"
              type="button"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}