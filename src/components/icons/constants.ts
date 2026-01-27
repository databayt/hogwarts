/**
 * Icon System Constants
 *
 * Design system rules, category definitions, and configuration constants
 * following the Anthropic artifact icon style guide.
 */

import { IconCategory, type StyleGuide } from "./types"

/**
 * Anthropic Design System Style Guide
 *
 * All icons must follow these rules to maintain visual consistency:
 * - ViewBox: 1000x1000 (square aspect ratio)
 * - Colors: Dual-color system (light + dark)
 * - Style: Minimalist, flat, no gradients
 * - File Size: Under 25KB
 */
export const ANTHROPIC_STYLE_GUIDE: StyleGuide = {
  viewBox: "0 0 1000 1000",

  colors: {
    light: "#FAF9F5", // Cream/off-white
    dark: "#141413", // Near-black
  },

  maxFileSize: 25 * 1024, // 25KB in bytes

  // Allowed SVG attributes (whitelist approach)
  allowedAttributes: [
    "xmlns",
    "viewBox",
    "width",
    "height",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "d", // path data
    "cx",
    "cy",
    "r", // circle
    "x",
    "y",
    "rx",
    "ry", // rect
    "opacity",
    "transform",
    "clip-path",
    "class",
    "id",
  ],

  // Forbidden SVG elements (security + style)
  forbiddenElements: [
    "script",
    "style",
    "foreignObject",
    "image",
    "video",
    "audio",
    "iframe",
    "embed",
    "object",
    "use", // external references
    "a", // links
    "animate", // animations
    "animateMotion",
    "animateTransform",
    "set",
    "linearGradient", // gradients not allowed
    "radialGradient",
    "filter", // complex filters
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feFlood",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMorphology",
    "feOffset",
    "feSpecularLighting",
    "feTile",
    "feTurbulence",
  ],

  pathCount: {
    min: 1,
    max: 50, // Keep icons simple
  },
}

/**
 * Alternative viewBox standards for specific use cases
 */
export const VIEWBOX_STANDARDS = {
  SQUARE_1000: "0 0 1000 1000", // Anthropic standard
  SQUARE_24: "0 0 24 24", // Common for UI icons
  SQUARE_32: "0 0 32 32",
  LANDSCAPE: "0 0 1680 1260",
  LOGO: "0 0 124 24", // Wide rectangular for logos
}

/**
 * Category metadata with descriptions and examples
 */
export const CATEGORY_INFO: Record<
  IconCategory,
  {
    label: string
    description: string
    examples: string[]
    color: string // For UI categorization
  }
> = {
  [IconCategory.SYSTEM]: {
    label: "System",
    description:
      "Core UI icons for buttons, navigation, and interface elements",
    examples: [
      "close",
      "menu",
      "search",
      "chevron",
      "check",
      "trash",
      "edit",
      "settings",
    ],
    color: "#6366f1", // Indigo
  },

  [IconCategory.ACADEMIC]: {
    label: "Academic",
    description: "School-specific icons for education features",
    examples: [
      "attendance",
      "grades",
      "exams",
      "assignments",
      "timetable",
      "classes",
      "subjects",
      "performance",
    ],
    color: "#8b5cf6", // Purple
  },

  [IconCategory.FINANCE]: {
    label: "Finance",
    description: "Financial and billing icons",
    examples: [
      "invoice",
      "receipt",
      "payment",
      "fees",
      "salary",
      "expenses",
      "budget",
      "reports",
    ],
    color: "#10b981", // Green
  },

  [IconCategory.COMMUNICATION]: {
    label: "Communication",
    description: "Messaging and notification icons",
    examples: [
      "message",
      "notification",
      "email",
      "chat",
      "announcement",
      "alert",
      "bell",
      "inbox",
    ],
    color: "#3b82f6", // Blue
  },

  [IconCategory.LIBRARY]: {
    label: "Library",
    description: "Library and resource management icons",
    examples: [
      "book",
      "library",
      "borrow",
      "return",
      "catalog",
      "shelf",
      "material",
      "archive",
    ],
    color: "#f59e0b", // Amber
  },

  [IconCategory.INTEGRATIONS]: {
    label: "Integrations",
    description: "Third-party service and technology logos",
    examples: [
      "github",
      "stripe",
      "google",
      "facebook",
      "vercel",
      "aws",
      "figma",
      "nextjs",
    ],
    color: "#64748b", // Slate
  },

  [IconCategory.BRANDING]: {
    label: "Branding",
    description: "School logos, certificates, and branded assets",
    examples: [
      "school-logo",
      "certificate",
      "seal",
      "badge",
      "award",
      "letterhead",
      "stamp",
      "emblem",
    ],
    color: "#ec4899", // Pink
  },

  [IconCategory.ILLUSTRATIONS]: {
    label: "Illustrations",
    description: "Decorative illustrations and complex graphics",
    examples: [
      "hand-build",
      "hand-stack",
      "puzzle",
      "artifact",
      "frame",
      "group",
      "objects",
      "concept",
    ],
    color: "#14b8a6", // Teal
  },

  [IconCategory.MARKETING]: {
    label: "Marketing",
    description: "Marketing and landing page graphics",
    examples: [
      "hero",
      "feature",
      "testimonial",
      "cta",
      "banner",
      "promo",
      "highlight",
      "showcase",
    ],
    color: "#f43f5e", // Rose
  },

  [IconCategory.CONTENT]: {
    label: "Content",
    description: "Document and file type icons",
    examples: [
      "file",
      "document",
      "pdf",
      "report",
      "logbook",
      "proposal",
      "article",
      "note",
    ],
    color: "#0ea5e9", // Sky
  },

  [IconCategory.DEVELOPMENT]: {
    label: "Development",
    description: "Developer tools and coding icons",
    examples: [
      "code",
      "terminal",
      "api",
      "debug",
      "git",
      "deploy",
      "build",
      "package",
    ],
    color: "#22c55e", // Green
  },

  [IconCategory.PROGRAMMING]: {
    label: "Programming",
    description: "Programming language logos and icons",
    examples: [
      "python",
      "typescript",
      "rust",
      "javascript",
      "go",
      "java",
      "c",
      "ruby",
    ],
    color: "#eab308", // Yellow
  },

  [IconCategory.PRODUCTIVITY]: {
    label: "Productivity",
    description: "Workflow and productivity icons",
    examples: [
      "task",
      "checklist",
      "calendar",
      "schedule",
      "reminder",
      "note",
      "project",
      "workflow",
    ],
    color: "#a855f7", // Purple
  },

  [IconCategory.APPLICATIONS]: {
    label: "Applications",
    description: "App-specific and feature icons",
    examples: [
      "chatbot",
      "starter",
      "template",
      "flow",
      "leads",
      "math",
      "cms",
      "app",
    ],
    color: "#06b6d4", // Cyan
  },

  [IconCategory.RATINGS]: {
    label: "Ratings",
    description: "Rating and quality indicator icons",
    examples: [
      "excellent",
      "good",
      "average",
      "poor",
      "star",
      "rating",
      "score",
      "quality",
    ],
    color: "#f97316", // Orange
  },

  [IconCategory.SHAPES]: {
    label: "Shapes",
    description: "Geometric shapes and symbols",
    examples: [
      "triangle",
      "circle",
      "square",
      "hexagon",
      "star",
      "diamond",
      "arrow",
      "polygon",
    ],
    color: "#78716c", // Stone
  },
}

/**
 * Default icon size classes (Tailwind)
 */
export const ICON_SIZES = {
  XS: "w-3 h-3",
  SM: "w-4 h-4",
  MD: "w-6 h-6",
  LG: "w-8 h-8",
  XL: "w-12 h-12",
  "2XL": "w-16 h-16",
}

/**
 * Common icon search tags by category
 */
export const CATEGORY_TAGS: Record<IconCategory, string[]> = {
  [IconCategory.SYSTEM]: [
    "ui",
    "interface",
    "control",
    "navigation",
    "action",
    "button",
  ],
  [IconCategory.ACADEMIC]: [
    "school",
    "education",
    "learning",
    "student",
    "teacher",
    "class",
  ],
  [IconCategory.FINANCE]: [
    "money",
    "payment",
    "billing",
    "accounting",
    "financial",
    "transaction",
  ],
  [IconCategory.COMMUNICATION]: [
    "message",
    "chat",
    "notify",
    "email",
    "alert",
    "social",
  ],
  [IconCategory.LIBRARY]: [
    "book",
    "resource",
    "material",
    "read",
    "borrow",
    "catalog",
  ],
  [IconCategory.INTEGRATIONS]: [
    "service",
    "api",
    "platform",
    "tool",
    "technology",
    "logo",
  ],
  [IconCategory.BRANDING]: [
    "brand",
    "identity",
    "logo",
    "school",
    "official",
    "custom",
  ],
  [IconCategory.ILLUSTRATIONS]: [
    "art",
    "graphic",
    "visual",
    "complex",
    "decorative",
    "concept",
  ],
  [IconCategory.MARKETING]: [
    "promo",
    "landing",
    "marketing",
    "feature",
    "showcase",
    "hero",
  ],
  [IconCategory.CONTENT]: [
    "file",
    "document",
    "text",
    "paper",
    "report",
    "article",
  ],
  [IconCategory.DEVELOPMENT]: [
    "code",
    "develop",
    "build",
    "terminal",
    "cli",
    "deploy",
  ],
  [IconCategory.PROGRAMMING]: [
    "language",
    "coding",
    "syntax",
    "runtime",
    "compiler",
    "script",
  ],
  [IconCategory.PRODUCTIVITY]: [
    "task",
    "workflow",
    "efficiency",
    "organize",
    "manage",
    "schedule",
  ],
  [IconCategory.APPLICATIONS]: [
    "app",
    "software",
    "tool",
    "feature",
    "module",
    "function",
  ],
  [IconCategory.RATINGS]: [
    "rating",
    "score",
    "quality",
    "feedback",
    "review",
    "evaluate",
  ],
  [IconCategory.SHAPES]: [
    "shape",
    "geometry",
    "form",
    "figure",
    "symbol",
    "graphic",
  ],
}

/**
 * SVG optimization settings
 */
export const SVG_OPTIMIZATION = {
  // Remove unnecessary attributes
  removeAttributes: [
    "data-name",
    "id",
    "class",
    "style",
    "xml:space",
    "enable-background",
  ],

  // Precision for path data
  floatPrecision: 2,

  // Remove empty groups
  removeEmptyContainers: true,

  // Remove unused namespaces
  removeUselessDefs: true,

  // Clean up path data
  cleanupEnableBackground: true,
}

/**
 * File naming conventions
 */
export const NAMING_CONVENTIONS = {
  // Kebab-case for file names
  FILE: /^[a-z0-9]+(-[a-z0-9]+)*$/,

  // PascalCase for component names
  COMPONENT: /^[A-Z][a-zA-Z0-9]*$/,

  // Reserved names (cannot be used)
  RESERVED: [
    "icon",
    "svg",
    "component",
    "index",
    "types",
    "utils",
    "constants",
    "registry",
  ],
}

/**
 * Multi-tenant configuration
 */
export const MULTI_TENANT_CONFIG = {
  // Maximum icons per school
  MAX_ICONS_PER_SCHOOL: 50,

  // Allowed categories for tenant-specific icons
  TENANT_CATEGORIES: [IconCategory.BRANDING, IconCategory.MARKETING],

  // Default school logo dimensions
  SCHOOL_LOGO_DIMENSIONS: {
    width: 200,
    height: 200,
    viewBox: "0 0 200 200",
  },
}

/**
 * Rate limits for icon generation (SVG Maker)
 */
export const RATE_LIMITS = {
  // Free tier: 3 credits per day
  FREE_TIER_DAILY: 3,

  // Initial credits
  FREE_TIER_INITIAL: 6,

  // Generation timeout (ms)
  GENERATION_TIMEOUT: 30000, // 30 seconds
}

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_VIEWBOX: "Icon must use viewBox '0 0 1000 1000' (Anthropic standard)",
  INVALID_COLORS:
    "Icon must use only light (#FAF9F5) and dark (#141413) colors",
  FILE_TOO_LARGE: "Icon file size must be under 25KB",
  FORBIDDEN_ELEMENT:
    "Icon contains forbidden elements (gradients, scripts, etc.)",
  INVALID_NAME: "Icon name must be kebab-case (e.g., 'attendance-present')",
  DUPLICATE_NAME: "An icon with this name already exists",
  RATE_LIMIT_EXCEEDED: "SVG Maker rate limit exceeded. Try again later.",
  GENERATION_FAILED: "Failed to generate icon. Please try again.",
}

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  ICON_ADDED: "Icon successfully added to the system!",
  ICON_GENERATED: "Icon generated successfully!",
  ICON_VALIDATED: "Icon validation passed!",
  REGISTRY_UPDATED: "Icon registry updated!",
}
