"use client";

import React from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import Link from "next/link";

/**
 * QuickActions Component
 * Displays a grid of quick action items for dashboard
 * - No outer cards, just action items
 * - Icon and text in columns (icon on top, text below)
 * - Full width, responsive grid
 * - Role-specific and reusable
 */

export interface QuickAction {
  iconName: string; // Icon name as string (e.g., "FileText", "Users")
  label: string;
  href?: string;
  onClick?: () => void;
}

// Map icon names to Lucide icon components
const iconMap: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  Users: LucideIcons.Users,
  FileText: LucideIcons.FileText,
  Bell: LucideIcons.Bell,
  CheckCircle: LucideIcons.CheckCircle,
  Calendar: LucideIcons.Calendar,
  BookOpen: LucideIcons.BookOpen,
  Award: LucideIcons.Award,
  CalendarDays: LucideIcons.CalendarDays,
  MessageSquare: LucideIcons.MessageSquare,
  ClipboardList: LucideIcons.ClipboardList,
  DollarSign: LucideIcons.DollarSign,
  Settings: LucideIcons.Settings,
  UserPlus: LucideIcons.UserPlus,
  BarChart3: LucideIcons.BarChart3,
  Clock: LucideIcons.Clock,
  FolderOpen: LucideIcons.FolderOpen,
};

interface QuickActionsProps {
  actions: QuickAction[];
  locale?: string;
  className?: string;
}

export function QuickActions({ actions, locale = "en", className }: QuickActionsProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Outer card wrapper */}
      <div className="rounded-lg border bg-card p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {actions.map((action, index) => {
            // Get icon component from map, fallback to FileText if not found
            const Icon = iconMap[action.iconName] || LucideIcons.FileText;
            const baseClasses = cn(
              "flex flex-col items-start justify-start gap-3 rounded-lg p-4 transition-all",
              "hover:bg-accent hover:scale-[1.02]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "cursor-pointer"
            );

            const content = (
              <>
                <Icon className="h-8 w-8 text-muted-foreground" aria-hidden={true} />
                <span className="text-sm font-medium">{action.label}</span>
              </>
            );

          if (action.href) {
            return (
              <Link
                key={`${action.label}-${index}`}
                href={`/${locale}${action.href}`}
                className={baseClasses}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={`${action.label}-${index}`}
              onClick={action.onClick}
              className={baseClasses}
              type="button"
            >
              {content}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}