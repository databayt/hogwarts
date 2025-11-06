/**
 * Icon System TypeScript Types
 *
 * Comprehensive type definitions for the Hogwarts icon management system.
 * Supports 240+ icons with categories, themes, and multi-tenant capabilities.
 */

import type { SVGProps } from "react"

/**
 * Base icon props extending standard SVG attributes
 */
export type IconProps = SVGProps<SVGSVGElement>

/**
 * Icon component type - function that returns JSX
 */
export type IconComponent = (props: IconProps) => React.JSX.Element

/**
 * Icon categories organized by domain and usage
 */
export enum IconCategory {
  // Core UI
  SYSTEM = "system",

  // Business Domains
  ACADEMIC = "academic",
  FINANCE = "finance",
  COMMUNICATION = "communication",
  LIBRARY = "library",

  // Technical
  INTEGRATIONS = "integrations",
  BRANDING = "branding",

  // Content
  ILLUSTRATIONS = "illustrations",
  MARKETING = "marketing",
}

/**
 * Theme variants for icons
 */
export enum IconTheme {
  LIGHT = "light",
  DARK = "dark",
}

/**
 * Icon style types
 */
export enum IconStyle {
  FILLED = "filled",
  OUTLINED = "outlined",
  DUOTONE = "duotone",
}

/**
 * Comprehensive icon metadata
 */
export type IconMetadata = {
  /** Unique identifier (kebab-case) */
  id: string

  /** Display name */
  name: string

  /** React component reference */
  component: IconComponent

  /** Primary category */
  category: IconCategory

  /** Secondary categories (for cross-category icons) */
  secondaryCategories?: IconCategory[]

  /** Search tags */
  tags: string[]

  /** Usage description */
  description?: string

  /** SVG viewBox (default: "0 0 1000 1000") */
  viewBox: string

  /** Available theme variants */
  variants?: IconTheme[]

  /** Icon style type */
  style?: IconStyle

  /** Can customize colors via className */
  customizable: boolean

  /** File path in public directory */
  filePath?: string

  /** Associated schoolId for tenant-specific icons */
  schoolId?: string

  /** Creation timestamp */
  createdAt?: Date

  /** Last update timestamp */
  updatedAt?: Date

  /** Author/creator */
  author?: string

  /** Deprecation info */
  deprecated?: {
    reason: string
    replacement?: string
  }
}

/**
 * Icon registry type - array of icon metadata
 */
export type IconRegistry = IconMetadata[]

/**
 * Anthropic design system style guide
 */
export type StyleGuide = {
  /** Standard viewBox dimensions */
  viewBox: string

  /** Standard color palette */
  colors: {
    light: string
    dark: string
  }

  /** Maximum file size in bytes */
  maxFileSize: number

  /** Allowed SVG attributes */
  allowedAttributes: string[]

  /** Forbidden SVG elements */
  forbiddenElements: string[]

  /** Minimum/maximum path count */
  pathCount?: {
    min: number
    max: number
  }
}

/**
 * Icon validation result
 */
export type ValidationResult = {
  /** Is the icon valid? */
  valid: boolean

  /** Validation errors (blocking) */
  errors: string[]

  /** Validation warnings (non-blocking) */
  warnings: string[]

  /** Suggestions for improvement */
  suggestions: string[]

  /** Detected metadata */
  metadata?: {
    viewBox?: string
    colors?: string[]
    pathCount?: number
    fileSize?: number
  }
}

/**
 * Icon search filters
 */
export type IconSearchFilters = {
  /** Search query (name, tags, description) */
  query?: string

  /** Filter by category */
  category?: IconCategory | "all"

  /** Filter by theme */
  theme?: IconTheme

  /** Filter by style */
  style?: IconStyle

  /** Only show customizable icons */
  customizableOnly?: boolean

  /** Filter by schoolId (multi-tenant) */
  schoolId?: string

  /** Sort order */
  sortBy?: "name" | "category" | "recent" | "popular"

  /** Sort direction */
  sortDirection?: "asc" | "desc"
}

/**
 * Icon generation options (for SVG Maker MCP)
 */
export type IconGenerationOptions = {
  /** Description prompt for SVG Maker */
  prompt: string

  /** Target category */
  category: IconCategory

  /** Desired icon name (kebab-case) */
  name: string

  /** Style constraints */
  style?: {
    viewBox?: string
    colors?: string[]
    minimalist?: boolean
    noGradients?: boolean
  }

  /** Generate variants (light/dark) */
  generateVariants?: boolean

  /** Associated schoolId for tenant-specific icons */
  schoolId?: string
}

/**
 * Icon import/export types
 */
export type IconImportResult = {
  /** Was import successful? */
  success: boolean

  /** Imported icon metadata */
  icon?: IconMetadata

  /** Import errors */
  errors?: string[]

  /** File path where icon was saved */
  filePath?: string
}

/**
 * Clipboard copy format
 */
export enum ClipboardFormat {
  /** Import statement */
  IMPORT = "import",

  /** JSX usage */
  JSX = "jsx",

  /** Raw SVG code */
  SVG = "svg",

  /** Icon ID only */
  ID = "id",
}

/**
 * Icon statistics
 */
export type IconStatistics = {
  /** Total icon count */
  total: number

  /** Count by category */
  byCategory: Record<IconCategory, number>

  /** Count by theme */
  byTheme: Record<IconTheme, number>

  /** Count by style */
  byStyle: Record<IconStyle, number>

  /** Customizable count */
  customizable: number

  /** Tenant-specific count */
  tenantSpecific: number
}
