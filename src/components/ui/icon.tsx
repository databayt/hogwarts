"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Re-export all icons from @aliimam/icons for direct usage
export * from "@aliimam/icons"

// Re-export missing icons from lucide-react that don't exist in @aliimam/icons
export {
  // Chart icons
  BarChart,
  BarChart2,
  BarChart3,
  BarChart4,
  PieChart,
  LineChart,
  AreaChart,
  FileBarChart,
  // Status icons with lucide naming
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  CheckCircle2,
  XCircle,
  // Action icons
  MoreHorizontal,
  MoreVertical,
  Edit,
  Edit2,
  Edit3,
  Filter,
  // Loader
  Loader2,
  // Calendar
  CalendarIcon,
  // Video/File
  FileVideo,
  // Book
  BookA as BookAIcon,
  // Layout
  LayoutDashboard,
  LayoutDashboard as LayoutDashboardIcon,
  // Grid
  Grid3X3 as Grid3x3,
  // Type export
  type LucideIcon,
} from "lucide-react"

// Import all icons as a namespace for the Icon component
import * as AliIcons from "@aliimam/icons"
import * as LucideIcons from "lucide-react"

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

  // Try @aliimam/icons first
  let IconComponent = (AliIcons as unknown as Record<string, React.ComponentType<AliIconProps>>)[mappedName]

  // Fall back to lucide-react if not found in @aliimam/icons
  if (!IconComponent) {
    IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<AliIconProps>>)[name]
  }

  if (!IconComponent) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Icon "${name}" not found in @aliimam/icons or lucide-react`)
    }
    return null
  }

  return <IconComponent size={size} className={cn(className)} {...props} />
}
