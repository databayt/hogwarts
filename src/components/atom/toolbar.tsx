"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Composable toolbar container
 * Provides a flex container for toolbar items with start/end positioning
 */
interface ToolbarProps {
  /** Toolbar children (ToolbarGroup, buttons, etc.) */
  children: React.ReactNode
  /** Additional class names */
  className?: string
  /** Orientation of the toolbar */
  orientation?: "horizontal" | "vertical"
}

export function Toolbar({
  children,
  className,
  orientation = "horizontal",
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-orientation={orientation}
      className={cn(
        "flex w-full items-center gap-2",
        orientation === "vertical" && "flex-col",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Toolbar group for positioning items
 */
interface ToolbarGroupProps {
  /** Group children */
  children: React.ReactNode
  /** Position of the group */
  position?: "start" | "end"
  /** Additional class names */
  className?: string
}

export function ToolbarGroup({
  children,
  position = "start",
  className,
}: ToolbarGroupProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        position === "end" && "ml-auto",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Toolbar separator
 */
interface ToolbarSeparatorProps {
  /** Additional class names */
  className?: string
  /** Orientation */
  orientation?: "horizontal" | "vertical"
}

export function ToolbarSeparator({
  className,
  orientation = "vertical",
}: ToolbarSeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-border shrink-0",
        orientation === "vertical" ? "h-5 w-px" : "h-px w-full",
        className
      )}
    />
  )
}
