/**
 * Icon System Utility Functions
 *
 * Helper functions for validation, sanitization, search, and icon management.
 */

import {
  ANTHROPIC_STYLE_GUIDE,
  CATEGORY_TAGS,
  ERROR_MESSAGES,
  NAMING_CONVENTIONS,
  SVG_OPTIMIZATION,
} from "./constants"
import { IconCategory, ClipboardFormat } from "./types"
import type {
  IconMetadata,
  IconRegistry,
  IconSearchFilters,
  IconStatistics,
  ValidationResult,
} from "./types"

/**
 * Validate SVG against Anthropic style guide
 */
export function validateIcon(svg: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Parse SVG (basic parsing without full DOM)
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/)
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : null

  // Check viewBox
  if (!viewBox) {
    errors.push("Missing viewBox attribute")
  } else if (viewBox !== ANTHROPIC_STYLE_GUIDE.viewBox) {
    errors.push(
      `${ERROR_MESSAGES.INVALID_VIEWBOX} (found: ${viewBox})`
    )
    suggestions.push(
      `Change viewBox to "${ANTHROPIC_STYLE_GUIDE.viewBox}"`
    )
  }

  // Check for forbidden elements
  for (const element of ANTHROPIC_STYLE_GUIDE.forbiddenElements) {
    const regex = new RegExp(`<${element}[\\s>]`, "i")
    if (regex.test(svg)) {
      errors.push(
        `${ERROR_MESSAGES.FORBIDDEN_ELEMENT}: <${element}>`
      )
      suggestions.push(`Remove all <${element}> elements`)
    }
  }

  // Check file size
  const fileSize = new Blob([svg]).size
  if (fileSize > ANTHROPIC_STYLE_GUIDE.maxFileSize) {
    errors.push(
      `${ERROR_MESSAGES.FILE_TOO_LARGE} (${Math.round(
        fileSize / 1024
      )}KB)`
    )
    suggestions.push("Optimize SVG to reduce file size")
  }

  // Check for fill colors
  const colors = extractColors(svg)
  const hasLightColor = colors.includes(
    ANTHROPIC_STYLE_GUIDE.colors.light
  )
  const hasDarkColor = colors.includes(
    ANTHROPIC_STYLE_GUIDE.colors.dark
  )

  if (!hasLightColor && !hasDarkColor) {
    warnings.push(
      "Icon does not use Anthropic color palette. Consider using #FAF9F5 (light) and #141413 (dark)"
    )
  }

  // Check path count
  const pathCount = (svg.match(/<path/g) || []).length
  if (ANTHROPIC_STYLE_GUIDE.pathCount) {
    if (pathCount < ANTHROPIC_STYLE_GUIDE.pathCount.min) {
      warnings.push("Icon has very few paths. Consider adding more detail.")
    } else if (pathCount > ANTHROPIC_STYLE_GUIDE.pathCount.max) {
      warnings.push(
        `Icon is complex (${pathCount} paths). Consider simplifying.`
      )
      suggestions.push("Simplify icon to reduce complexity")
    }
  }

  // Check for event handlers (security)
  const eventHandlers = [
    "onclick",
    "onload",
    "onerror",
    "onmouseover",
    "onmouseout",
  ]
  for (const handler of eventHandlers) {
    if (svg.toLowerCase().includes(handler)) {
      errors.push(`Security risk: Contains ${handler} event handler`)
      suggestions.push(`Remove all event handlers`)
    }
  }

  // Check for external references
  if (svg.includes("xlink:href") || svg.includes("href=")) {
    warnings.push("Icon contains external references")
    suggestions.push(
      "Consider inlining all resources for better performance"
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    metadata: {
      viewBox: viewBox || undefined,
      colors,
      pathCount,
      fileSize,
    },
  }
}

/**
 * Sanitize SVG for security
 */
export function sanitizeSvg(svg: string): string {
  let sanitized = svg

  // Remove XML declaration
  sanitized = sanitized.replace(/<\?xml[^>]*\?>/g, "")

  // Remove comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, "")

  // Remove script tags
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "")

  // Remove style tags
  sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/gi, "")

  // Remove event handlers
  const eventHandlers = [
    "onclick",
    "onload",
    "onerror",
    "onmouseover",
    "onmouseout",
    "onmouseenter",
    "onmouseleave",
    "onfocus",
    "onblur",
  ]
  for (const handler of eventHandlers) {
    const regex = new RegExp(`${handler}=["'][^"']*["']`, "gi")
    sanitized = sanitized.replace(regex, "")
  }

  // Remove forbidden elements
  for (const element of ANTHROPIC_STYLE_GUIDE.forbiddenElements) {
    const regex = new RegExp(
      `<${element}[\\s\\S]*?<\\/${element}>`,
      "gi"
    )
    sanitized = sanitized.replace(regex, "")
    // Also remove self-closing tags
    const selfClosingRegex = new RegExp(`<${element}[^>]*\\/>`, "gi")
    sanitized = sanitized.replace(selfClosingRegex, "")
  }

  // Remove data attributes for optimization
  for (const attr of SVG_OPTIMIZATION.removeAttributes) {
    const regex = new RegExp(`\\s${attr}=["'][^"']*["']`, "gi")
    sanitized = sanitized.replace(regex, "")
  }

  return sanitized.trim()
}

/**
 * Extract colors from SVG
 */
function extractColors(svg: string): string[] {
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g
  const matches = svg.match(colorRegex) || []
  return [...new Set(matches)].map((c) => c.toUpperCase())
}

/**
 * Validate icon name
 */
export function validateIconName(name: string): {
  valid: boolean
  error?: string
} {
  // Check if name is kebab-case
  if (!NAMING_CONVENTIONS.FILE.test(name)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_NAME,
    }
  }

  // Check if name is reserved
  if (NAMING_CONVENTIONS.RESERVED.includes(name.toLowerCase())) {
    return {
      valid: false,
      error: `"${name}" is a reserved name and cannot be used`,
    }
  }

  return { valid: true }
}

/**
 * Convert icon name to different cases
 */
export function convertIconName(name: string) {
  // kebab-case to PascalCase
  const toPascalCase = (str: string) =>
    str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("")

  // kebab-case to camelCase
  const toCamelCase = (str: string) => {
    const pascal = toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  return {
    kebab: name,
    pascal: toPascalCase(name),
    camel: toCamelCase(name),
    component: `${toPascalCase(name)}Icon`,
  }
}

/**
 * Search icons with filters
 */
export function searchIcons(
  registry: IconRegistry,
  filters: IconSearchFilters
): IconMetadata[] {
  let results = [...registry]

  // Filter by query
  if (filters.query) {
    const query = filters.query.toLowerCase()
    results = results.filter(
      (icon) =>
        icon.name.toLowerCase().includes(query) ||
        icon.id.toLowerCase().includes(query) ||
        icon.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        icon.description?.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (filters.category && filters.category !== "all") {
    results = results.filter(
      (icon) =>
        icon.category === filters.category ||
        icon.secondaryCategories?.includes(filters.category as IconCategory)
    )
  }

  // Filter by theme
  if (filters.theme) {
    results = results.filter(
      (icon) => !icon.variants || icon.variants.includes(filters.theme!)
    )
  }

  // Filter by customizable
  if (filters.customizableOnly) {
    results = results.filter((icon) => icon.customizable)
  }

  // Filter by schoolId (multi-tenant)
  if (filters.schoolId) {
    results = results.filter(
      (icon) =>
        !icon.schoolId || // Public icons
        icon.schoolId === filters.schoolId // Tenant-specific icons
    )
  }

  // Sort results
  if (filters.sortBy) {
    results.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "recent":
          comparison =
            (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
          break
        case "popular":
          // TODO: Track usage statistics
          comparison = 0
          break
      }

      return filters.sortDirection === "desc" ? -comparison : comparison
    })
  }

  return results
}

/**
 * Get icon statistics
 */
export function getIconStatistics(
  registry: IconRegistry
): IconStatistics {
  const stats: IconStatistics = {
    total: registry.length,
    byCategory: {} as Record<IconCategory, number>,
    byTheme: { light: 0, dark: 0 },
    byStyle: { filled: 0, outlined: 0, duotone: 0 },
    customizable: 0,
    tenantSpecific: 0,
  }

  // Initialize category counts
  Object.values(IconCategory).forEach((category) => {
    stats.byCategory[category as IconCategory] = 0
  })

  // Calculate statistics
  for (const icon of registry) {
    // Count by category
    stats.byCategory[icon.category]++

    // Count by theme
    if (icon.variants) {
      if (icon.variants.includes("light" as any)) stats.byTheme.light++
      if (icon.variants.includes("dark" as any)) stats.byTheme.dark++
    }

    // Count by style
    if (icon.style) {
      stats.byStyle[icon.style]++
    }

    // Count customizable
    if (icon.customizable) {
      stats.customizable++
    }

    // Count tenant-specific
    if (icon.schoolId) {
      stats.tenantSpecific++
    }
  }

  return stats
}

/**
 * Generate clipboard content
 */
export function generateClipboardContent(
  icon: IconMetadata,
  format: ClipboardFormat
): string {
  switch (format) {
    case ClipboardFormat.IMPORT:
      return `import type { Icons } from '@/components/icons'\n\n<Icons.${icon.id} className="w-6 h-6" />`

    case ClipboardFormat.JSX:
      return `<Icons.${icon.id} className="w-6 h-6" />`

    case ClipboardFormat.SVG:
      // Note: This would need to read the actual SVG file
      return `<!-- SVG code for ${icon.name} -->\n<!-- File: ${icon.filePath} -->`

    case ClipboardFormat.ID:
      return icon.id

    default:
      return icon.id
  }
}

/**
 * Get suggested tags for category
 */
export function getSuggestedTags(category: IconCategory): string[] {
  return CATEGORY_TAGS[category] || []
}

/**
 * Generate icon component code
 */
export function generateIconComponent(
  name: string,
  svgContent: string
): string {
  const { component } = convertIconName(name)

  // Extract SVG attributes
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/)
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 1000 1000"

  // Extract paths
  const pathMatches = svgContent.matchAll(/<path[^>]*>/g)
  const paths = Array.from(pathMatches)
    .map((match) => match[0])
    .join("\n      ")

  return `export const ${component} = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${viewBox}"
    fill="none"
    {...props}
  >
    ${paths}
  </svg>
)`
}

/**
 * Optimize SVG code
 */
export function optimizeSvg(svg: string): string {
  let optimized = svg

  // Remove unnecessary whitespace
  optimized = optimized.replace(/\s+/g, " ")

  // Remove newlines
  optimized = optimized.replace(/\n/g, "")

  // Trim
  optimized = optimized.trim()

  // Round path precision
  optimized = optimized.replace(
    /\d+\.\d{3,}/g,
    (match) => parseFloat(match).toFixed(SVG_OPTIMIZATION.floatPrecision)
  )

  return optimized
}

/**
 * Check if icon exists in registry
 */
export function iconExists(
  registry: IconRegistry,
  id: string
): boolean {
  return registry.some((icon) => icon.id === id)
}

/**
 * Get icon by ID
 */
export function getIconById(
  registry: IconRegistry,
  id: string
): IconMetadata | undefined {
  return registry.find((icon) => icon.id === id)
}

/**
 * Get icons by category
 */
export function getIconsByCategory(
  registry: IconRegistry,
  category: IconCategory
): IconMetadata[] {
  return registry.filter(
    (icon) =>
      icon.category === category ||
      icon.secondaryCategories?.includes(category)
  )
}
