// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Utility functions for Marketing Features
 */

import type { Feature, FeatureCategory, FeatureComparison } from "./types"

/**
 * Filter features by category
 */
export function filterFeaturesByCategory(
  features: Feature[],
  category: FeatureCategory
): Feature[] {
  return features.filter((feature) => feature.category === category)
}

/**
 * Get features by multiple categories
 */
export function getFeaturesByCategories(
  features: Feature[],
  categories: FeatureCategory[]
): Feature[] {
  return features.filter((feature) => categories.includes(feature.category))
}

/**
 * Get new features
 */
export function getNewFeatures(features: Feature[]): Feature[] {
  return features.filter((feature) => feature.isNew === true)
}

/**
 * Get premium features
 */
export function getPremiumFeatures(features: Feature[]): Feature[] {
  return features.filter((feature) => feature.isPremium === true)
}

/**
 * Search features by query
 */
export function searchFeatures(features: Feature[], query: string): Feature[] {
  const lowerQuery = query.toLowerCase()
  return features.filter(
    (feature) =>
      feature.title.toLowerCase().includes(lowerQuery) ||
      feature.description.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Group features by category
 */
export function groupFeaturesByCategory(
  features: Feature[]
): Map<FeatureCategory, Feature[]> {
  const grouped = new Map<FeatureCategory, Feature[]>()

  features.forEach((feature) => {
    if (!grouped.has(feature.category)) {
      grouped.set(feature.category, [])
    }
    grouped.get(feature.category)!.push(feature)
  })

  return grouped
}

/**
 * Get category label
 */
export function getCategoryLabel(category: FeatureCategory): string {
  const labels: Record<FeatureCategory, string> = {
    core: "Core",
    academic: "Academic",
    scheduling: "Scheduling",
    finance: "Finance",
    facilities: "Facilities",
    hr: "HR",
    operations: "Operations",
    analytics: "Analytics",
    communication: "Communication",
    enrollment: "Enrollment",
    community: "Community",
    welfare: "Welfare",
    "e-learning": "E-Learning",
    documents: "Documents",
  }
  return labels[category]
}

/**
 * Format feature availability for comparison
 */
export function formatFeatureAvailability(value: boolean | string): string {
  if (typeof value === "boolean") {
    return value ? "\u2713" : "\u2014"
  }
  return value
}

/**
 * Check if feature is available in plan
 */
export function isFeatureAvailableInPlan(
  comparison: FeatureComparison,
  plan: "starter" | "professional" | "enterprise"
): boolean {
  const value = comparison[plan]
  return value === true || (typeof value === "string" && value !== "\u2014")
}

/**
 * Get features count by category
 */
export function getFeatureCountByCategory(
  features: Feature[]
): Record<FeatureCategory, number> {
  const counts = {} as Record<FeatureCategory, number>

  features.forEach((feature) => {
    counts[feature.category] = (counts[feature.category] || 0) + 1
  })

  return counts
}

/**
 * Sort features by priority (new first, then premium)
 */
export function sortFeaturesByPriority(features: Feature[]): Feature[] {
  return [...features].sort((a, b) => {
    if (a.isNew && !b.isNew) return -1
    if (!a.isNew && b.isNew) return 1
    if (a.isPremium && !b.isPremium) return -1
    if (!a.isPremium && b.isPremium) return 1
    return a.title.localeCompare(b.title)
  })
}

/**
 * Get feature icon color based on category
 */
export function getFeatureIconColor(category: FeatureCategory): string {
  const colors: Record<FeatureCategory, string> = {
    core: "text-blue-600",
    academic: "text-purple-600",
    scheduling: "text-pink-600",
    finance: "text-amber-600",
    facilities: "text-emerald-600",
    hr: "text-indigo-600",
    operations: "text-slate-600",
    analytics: "text-cyan-600",
    communication: "text-orange-600",
    enrollment: "text-teal-600",
    community: "text-rose-600",
    welfare: "text-red-600",
    "e-learning": "text-violet-600",
    documents: "text-stone-600",
  }
  return colors[category] || "text-gray-600"
}

/**
 * Generate feature slug for URL
 */
export function generateFeatureSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
