"use client";

import React from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {actions.map((action, index) => {
          // Get icon component from map, fallback to FileText if not found
          const Icon = iconMap[action.iconName] || LucideIcons.FileText;

          const content = (
            <Card className="aspect-square">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full">
                <Icon className="h-6 w-6" aria-hidden={true} />
                <span className="text-sm font-medium text-center">{action.label}</span>
              </CardContent>
            </Card>
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
              className="block w-full"
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