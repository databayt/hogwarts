"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Re-export all icons from @aliimam/icons for direct usage
export * from "lucide-react"

// Import all icons as a namespace for the Icon component
import * as AliIcons from "lucide-react"

// Get the IconProps type from the package
type AliIconProps = React.ComponentProps<typeof AliIcons.Clock>

// Icon name mapping from lucide-react to @aliimam/icons
export const iconMapping: Record<string, string> = {
  // Status icons (naming differs)
  AlertCircle: "CircleAlert",
  AlertTriangle: "TriangleAlert",
  AlertOctagon: "OctagonAlert",
  CheckCircle: "CircleCheck",
  CheckCircle2: "CircleCheckBig",
  XCircle: "CircleX",
  InfoIcon: "Info",

  // Action icons
  MoreHorizontal: "Ellipsis",
  MoreVertical: "EllipsisVertical",
  Edit: "Pencil",
  Edit2: "PencilLine",
  Edit3: "PencilOff",

  // Navigation
  Home: "House",
  HomeIcon: "House",

  // Loader variants
  Loader2: "LoaderCircle",

  // Calendar variants
  CalendarIcon: "Calendar",

  // Filter
  Filter: "ListFilter",
  FilterIcon: "ListFilter",

  // Circle variants (lucide uses XCircle, aliimam uses CircleX)
  PlayCircle: "CirclePlay",
  PauseCircle: "CirclePause",
  StopCircle: "CircleStop",
  PlusCircle: "CirclePlus",
  MinusCircle: "CircleMinus",
  HelpCircle: "CircleHelp",

  // Unlock
  Unlock: "LockOpen",
}

// Extended IconProps
export interface IconProps extends Omit<AliIconProps, 'ref'> {
  /**
   * Icon name - supports both @aliimam/icons names and lucide-react aliases
   */
  name: string
  /**
   * Icon size (default: 24)
   */
  size?: number
  /**
   * Additional className
   */
  className?: string
}

/**
 * Unified Icon component for the platform
 * Supports both @aliimam/icons names and lucide-react aliases for backwards compatibility
 *
 * @example
 * // Using @aliimam/icons name
 * <Icon name="Clock" size={24} />
 *
 * // Using lucide-react alias (automatically mapped)
 * <Icon name="AlertCircle" size={24} /> // Maps to CircleAlert
 */
export function Icon({
  name,
  size = 24,
  className,
  ...props
}: IconProps) {
  // Check if there's a mapping for this icon name
  const mappedName = iconMapping[name] || name

  // Get the icon component from the icons namespace
  const IconComponent = (AliIcons as unknown as Record<string, React.ComponentType<AliIconProps>>)[mappedName]

  if (!IconComponent) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Icon "${name}" (mapped to "${mappedName}") not found in @aliimam/icons`)
    }
    return null
  }

  return <IconComponent size={size} className={cn(className)} {...props} />
}
