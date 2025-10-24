"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

/**
 * QuickActions Component
 * Displays a grid of quick action buttons for dashboard
 * Following React 19 best practices - no manual memoization
 */

export interface QuickAction {
  icon: LucideIcon;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  variant?: "ghost" | "outline" | "secondary" | "default";
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        const ButtonContent = (
          <>
            <Icon className="h-8 w-8 mb-2" aria-hidden="true" />
            <span className="text-sm font-medium">{action.label}</span>
            {action.description && (
              <span className="text-xs text-muted-foreground mt-1">
                {action.description}
              </span>
            )}
          </>
        );

        if (action.href) {
          return (
            <Button
              key={`${action.label}-${index}`}
              variant={action.variant || "ghost"}
              className="h-auto flex flex-col items-center justify-center p-4 w-full"
              asChild
            >
              <Link href={action.href}>
                {ButtonContent}
              </Link>
            </Button>
          );
        }

        return (
          <Button
            key={`${action.label}-${index}`}
            variant={action.variant || "ghost"}
            className="h-auto flex flex-col items-center justify-center p-4 w-full"
            onClick={action.onClick}
          >
            {ButtonContent}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * QuickActionsCard Component
 * Wraps QuickActions in a card (optional usage)
 */
interface QuickActionsCardProps extends QuickActionsProps {
  title?: string;
}

export function QuickActionsCard({ title, ...props }: QuickActionsCardProps) {
  return (
    <div className="space-y-4">
      {title && <h2>{title}</h2>}
      <QuickActions {...props} />
    </div>
  );
}