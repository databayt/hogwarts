/**
 * Type definitions for Marketing Features
 *
 * Types for feature showcase, comparison, and presentation.
 */

import { LucideIcon } from "lucide-react";

/**
 * Feature item
 */
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: FeatureCategory;
  isNew?: boolean;
  isPremium?: boolean;
}

/**
 * Feature category
 */
export type FeatureCategory =
  | "student-management"
  | "attendance"
  | "grading"
  | "communication"
  | "analytics"
  | "scheduling"
  | "billing"
  | "reporting";

/**
 * Feature comparison item
 */
export interface FeatureComparison {
  feature: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
  description?: string;
}

/**
 * Feature showcase section
 */
export interface FeatureShowcase {
  id: string;
  title: string;
  subtitle: string;
  features: Feature[];
  cta?: {
    label: string;
    href: string;
  };
}

/**
 * Feature detail
 */
export interface FeatureDetail extends Feature {
  longDescription: string;
  benefits: string[];
  useCases: string[];
  screenshots?: string[];
  videoUrl?: string;
  relatedFeatures?: string[];
}

/**
 * Feature category info
 */
export interface FeatureCategoryInfo {
  id: FeatureCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}
