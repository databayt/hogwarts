"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  locale?: string;
  className?: string;
}

export function QuickActions({ actions, locale = "en", className }: QuickActionsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const baseClasses = cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border bg-card p-4 transition-all",
            "hover:bg-accent hover:shadow-sm hover:scale-[1.02]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "cursor-pointer"
          );

          const content = (
            <>
              <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <span className="text-center text-xs font-medium leading-tight">{action.label}</span>
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
  );
}