// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Type definitions for Marketing Features
 *
 * Types for feature showcase, comparison, and presentation.
 */

/**
 * Feature item
 */
export interface Feature {
  id: string
  title: string
  description: string
  icon: string
  category: FeatureCategory
  isNew?: boolean
  isPremium?: boolean
}

/**
 * Feature category
 */
export type FeatureCategory =
  | "core"
  | "academic"
  | "scheduling"
  | "finance"
  | "facilities"
  | "hr"
  | "operations"
  | "analytics"
  | "communication"
  | "enrollment"
  | "community"
  | "welfare"
  | "e-learning"
  | "documents"

/**
 * Feature comparison item
 */
export interface FeatureComparison {
  feature: string
  starter: boolean | string
  professional: boolean | string
  enterprise: boolean | string
  description?: string
}

/**
 * Feature showcase section
 */
export interface FeatureShowcase {
  id: string
  title: string
  subtitle: string
  features: Feature[]
  cta?: {
    label: string
    href: string
  }
}

/**
 * Feature detail
 */
export interface FeatureDetail extends Feature {
  longDescription: string
  benefits: string[]
  useCases: string[]
  screenshots?: string[]
  videoUrl?: string
  relatedFeatures?: string[]
}

/**
 * Feature category info
 */
export interface FeatureCategoryInfo {
  id: FeatureCategory
  label: string
  description: string
  icon: string
  color: string
}

/**
 * Impact metric
 */
export interface ImpactMetric {
  value: string
  label: string
  description: string
}
