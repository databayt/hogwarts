"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface GridCardAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}

interface GridCardProps {
  /** Main title */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Avatar/image URL */
  avatarUrl?: string;
  /** Fallback initials for avatar */
  avatarFallback?: string;
  /** Status badge */
  status?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  /** Additional badges */
  badges?: Array<{
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }>;
  /** Metadata fields to display */
  metadata?: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
  /** Actions available for this card */
  actions?: GridCardAction[];
  /** Actions menu label */
  actionsLabel?: string;
  /** Click handler for the card */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
  /** Children to render in content area */
  children?: React.ReactNode;
}

export function GridCard({
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  status,
  badges = [],
  metadata = [],
  actions = [],
  actionsLabel = "Actions",
  onClick,
  className,
  children,
}: GridCardProps) {
  const hasAvatar = avatarUrl || avatarFallback;

  return (
    <Card
      className={cn(
        "group relative transition-shadow hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasAvatar && (
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={avatarUrl} alt={title} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{title}</h4>
              {subtitle && (
                <p className="muted text-xs truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={actionsLabel}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>{actionsLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.onClick}
                    className={cn(
                      action.variant === "destructive" && "text-destructive"
                    )}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Status and badges */}
        {(status || badges.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {status && (
              <Badge variant={status.variant || "default"}>{status.label}</Badge>
            )}
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant || "outline"}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {/* Metadata */}
      {metadata.length > 0 && (
        <CardContent className="pt-0">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            {metadata.map((item, index) => (
              <div key={index} className="flex flex-col">
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="text-sm truncate">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      )}

      {/* Custom content */}
      {children && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Grid container component
 */
interface GridContainerProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function GridContainer({
  children,
  columns = 3,
  className,
}: GridContainerProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

/**
 * Empty state for grid view
 */
interface GridEmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function GridEmptyState({
  title = "No items found",
  description = "Try adjusting your search or filters",
  action,
  icon,
}: GridEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="font-medium">{title}</h3>
      <p className="muted text-sm mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
