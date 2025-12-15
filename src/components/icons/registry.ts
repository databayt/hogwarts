/**
 * Icon Registry
 *
 * Central registry of all icons with comprehensive metadata.
 * This file will be populated during the migration phase.
 *
 * Icons are organized by category and include:
 * - System icons (89 existing from icons.tsx)
 * - Integration logos (46 company icons)
 * - Illustrations (22 hand gestures, artifacts)
 * - Academic icons (NEW - generated)
 * - Finance icons (NEW - generated)
 * - Branding icons (NEW - school logos, certificates)
 */

import type { IconMetadata, IconRegistry } from "./types"
import { IconCategory } from "./types"

/**
 * Icon Registry
 *
 * Note: This registry will be populated in Phase 2 (Migration).
 * Structure:
 *
 * export const iconRegistry: IconRegistry = [
 *   {
 *     id: "github",
 *     name: "GitHub",
 *     component: GitHubIcon,
 *     category: IconCategory.INTEGRATIONS,
 *     tags: ["logo", "git", "version-control", "code"],
 *     description: "GitHub logo for integration links",
 *     viewBox: "0 0 24 24",
 *     customizable: true,
 *     createdAt: new Date("2025-01-05"),
 *   },
 *   // ... 240+ more icons
 * ]
 */
export const iconRegistry: IconRegistry = [
  // Anthropic Icons - Core Values
  {
    id: "network-nodes",
    name: "Network Nodes",
    component: () => null as any,
    category: IconCategory.ILLUSTRATIONS,
    tags: [
      "anthropic",
      "network",
      "nodes",
      "connected",
      "circles",
      "courage",
      "core-values",
    ],
    description:
      "Interconnected network of nodes representing courage and connection. From Anthropic design system.",
    viewBox: "0 0 1200 1200",
    customizable: false,
    filePath: "/anthropic/claude-code-best-practices.svg",
    createdAt: new Date("2025-12-03"),
    author: "Anthropic",
  },
  {
    id: "growth-flourish",
    name: "Growth Flourish",
    component: () => null as any,
    category: IconCategory.ILLUSTRATIONS,
    tags: [
      "anthropic",
      "growth",
      "flourish",
      "person",
      "organic",
      "wisdom",
      "core-values",
    ],
    description:
      "Abstract figure with organic flourishing elements representing wisdom and growth. From Anthropic design system.",
    viewBox: "0 0 1000 1000",
    customizable: false,
    filePath: "/anthropic/category-06.svg",
    createdAt: new Date("2025-12-03"),
    author: "Anthropic",
  },
  {
    id: "frame-boundary",
    name: "Frame Boundary",
    component: () => null as any,
    category: IconCategory.ILLUSTRATIONS,
    tags: [
      "anthropic",
      "frame",
      "boundary",
      "rounded",
      "rectangle",
      "loyalty",
      "core-values",
    ],
    description:
      "Rounded rectangle frame representing loyalty and commitment boundaries. From Anthropic design system.",
    viewBox: "0 0 1200 1200",
    customizable: false,
    filePath: "/anthropic/think-tool.svg",
    createdAt: new Date("2025-12-03"),
    author: "Anthropic",
  },
  {
    id: "reaching-ascent",
    name: "Reaching Ascent",
    component: () => null as any,
    category: IconCategory.ILLUSTRATIONS,
    tags: [
      "anthropic",
      "reaching",
      "ascent",
      "climbing",
      "aspiring",
      "ambition",
      "core-values",
    ],
    description:
      "Abstract figure reaching upward with dynamic motion representing ambition. From Anthropic design system.",
    viewBox: "0 0 1000 1000",
    customizable: false,
    filePath: "/anthropic/category-03.svg",
    createdAt: new Date("2025-12-03"),
    author: "Anthropic",
  },
]

/**
 * Helper function to get icon count
 */
export function getIconCount(): number {
  return iconRegistry.length
}

/**
 * Helper function to get all icon IDs
 */
export function getAllIconIds(): string[] {
  return iconRegistry.map((icon) => icon.id)
}

/**
 * Helper function to register a new icon
 * (Used during development/migration)
 */
export function registerIcon(metadata: IconMetadata): void {
  // Check for duplicates
  const exists = iconRegistry.some((icon) => icon.id === metadata.id)
  if (exists) {
    console.warn(`Icon "${metadata.id}" already registered. Skipping.`)
    return
  }

  iconRegistry.push(metadata)
}

/**
 * Placeholder icons for testing
 * TODO: Remove after migration
 */
export const PLACEHOLDER_ICONS: IconRegistry = [
  {
    id: "placeholder-system",
    name: "System Placeholder",
    component: () => null as any,
    category: IconCategory.SYSTEM,
    tags: ["placeholder", "test"],
    description: "Placeholder icon for testing",
    viewBox: "0 0 24 24",
    customizable: true,
  },
  {
    id: "placeholder-academic",
    name: "Academic Placeholder",
    component: () => null as any,
    category: IconCategory.ACADEMIC,
    tags: ["placeholder", "test"],
    description: "Placeholder icon for testing",
    viewBox: "0 0 24 24",
    customizable: true,
  },
]
