"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Calendar, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScheduledStatusBadgeProps {
  published: boolean;
  scheduledFor?: Date | string | null;
  expiresAt?: Date | string | null;
  className?: string;
}

export function ScheduledStatusBadge({
  published,
  scheduledFor,
  expiresAt,
  className,
}: ScheduledStatusBadgeProps) {
  const now = new Date();
  const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
  const expiresDate = expiresAt ? new Date(expiresAt) : null;

  // Determine status
  let status: "published" | "scheduled" | "draft" | "expired";
  let icon: React.ReactNode;
  let label: string;
  let variant: "default" | "secondary" | "destructive" | "outline";
  let tooltipText: string;

  if (expiresDate && expiresDate < now && published) {
    // Expired
    status = "expired";
    icon = <XCircle className="h-3 w-3" />;
    label = "Expired";
    variant = "destructive";
    tooltipText = `Expired on ${expiresDate.toLocaleString()}`;
  } else if (published) {
    // Published
    status = "published";
    icon = <CheckCircle className="h-3 w-3" />;
    label = "Published";
    variant = "default";
    tooltipText = "Currently published";
  } else if (scheduledDate && scheduledDate > now) {
    // Scheduled for future
    status = "scheduled";
    icon = <Calendar className="h-3 w-3" />;
    label = "Scheduled";
    variant = "secondary";
    tooltipText = `Scheduled for ${scheduledDate.toLocaleString()}`;
  } else {
    // Draft
    status = "draft";
    icon = <Clock className="h-3 w-3" />;
    label = "Draft";
    variant = "outline";
    tooltipText = "Not yet published";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(
              "gap-1",
              status === "scheduled" && "bg-blue-100 text-blue-700",
              status === "expired" && "bg-red-100 text-red-700",
              className
            )}
          >
            {icon}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{tooltipText}</p>
          {expiresDate && status !== "expired" && (
            <p className="text-xs text-muted-foreground mt-1">
              Expires: {expiresDate.toLocaleString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
