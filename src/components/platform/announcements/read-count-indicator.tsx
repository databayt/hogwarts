"use client";

import { Eye, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReadCountIndicatorProps {
  totalReads: number;
  uniqueReaders: number;
  readPercentage?: number;
  className?: string;
  showIcon?: boolean;
}

export function ReadCountIndicator({
  totalReads,
  uniqueReaders,
  readPercentage,
  className,
  showIcon = true,
}: ReadCountIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm text-muted-foreground",
              className
            )}
          >
            {showIcon && <Eye className="h-3.5 w-3.5" />}
            <span className="font-medium">{uniqueReaders}</span>
            {totalReads !== uniqueReaders && (
              <span className="text-xs">({totalReads})</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>{uniqueReaders} unique readers</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            <span>{totalReads} total views</span>
          </div>
          {readPercentage !== undefined && readPercentage > 0 && (
            <div className="text-xs text-muted-foreground">
              {readPercentage.toFixed(1)}% of target audience
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
