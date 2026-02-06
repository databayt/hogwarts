"use client"

import * as React from "react"
import { LayoutGrid, List } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ViewMode } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Toggle button for switching between table and grid views
 */
interface ViewToggleProps {
  /** Current view mode */
  view: ViewMode
  /** Toggle handler */
  onToggle: () => void
  /** i18n translations */
  translations?: {
    tableView?: string
    gridView?: string
    switchToTable?: string
    switchToGrid?: string
  }
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
  /** Button variant */
  variant?: "default" | "outline" | "ghost"
  /** Additional class names */
  className?: string
}

export function ViewToggle({
  view,
  onToggle,
  translations = {},
  size = "icon",
  variant = "outline",
  className,
}: ViewToggleProps) {
  const t = {
    tableView: translations.tableView || "Table View",
    gridView: translations.gridView || "Grid View",
    switchToTable: translations.switchToTable || "Switch to table view",
    switchToGrid: translations.switchToGrid || "Switch to grid view",
  }

  const isTable = view === "table"
  const tooltipText = isTable ? t.switchToGrid : t.switchToTable

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={onToggle}
            className={cn(size === "icon" && "h-9 w-9 p-0", className)}
            aria-label={tooltipText}
          >
            {isTable ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Segmented control variant for view toggle
 */
interface ViewToggleSegmentedProps {
  /** Current view mode */
  view: ViewMode
  /** Set view handler */
  setView: (view: ViewMode) => void
  /** i18n translations */
  translations?: {
    tableView?: string
    gridView?: string
  }
  /** Additional class names */
  className?: string
}

export function ViewToggleSegmented({
  view,
  setView,
  translations = {},
  className,
}: ViewToggleSegmentedProps) {
  const t = {
    tableView: translations.tableView || "Table",
    gridView: translations.gridView || "Grid",
  }

  return (
    <div
      className={cn(
        "bg-muted inline-flex items-center rounded-md border p-1",
        className
      )}
      role="group"
      aria-label="View mode"
    >
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("table")}
        className="h-7 px-2.5"
        aria-pressed={view === "table"}
      >
        <List className="me-1.5 h-4 w-4" />
        {t.tableView}
      </Button>
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("grid")}
        className="h-7 px-2.5"
        aria-pressed={view === "grid"}
      >
        <LayoutGrid className="me-1.5 h-4 w-4" />
        {t.gridView}
      </Button>
    </div>
  )
}
