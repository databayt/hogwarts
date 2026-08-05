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
}

/**
 * Feature category — mirrors OpenEduCat's 10 module groups
 */
export type FeatureCategory =
  | "core"
  | "essential"
  | "advance"
  | "erp"
  | "management"
  | "communication"
  | "e-learning"
  | "technical"
  | "integration"
  | "ai"

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
  id: string
  value: string
  label: string
  description: string
}

// ─── Feature Page Section Types ───

export interface HeroSection {
  type: "hero"
  heading: string
  description: string
}

export interface RoleCard {
  title: string
  description: string
}

export interface RoleCardsSection {
  type: "role-cards"
  heading: string
  cards: RoleCard[]
}

export interface BenefitItem {
  title: string
  description: string
}

export interface BenefitsGridSection {
  type: "benefits-grid"
  heading: string
  description?: string
  items: BenefitItem[]
}

export interface StatItem {
  value: string
  label: string
}

export interface StatsBarSection {
  type: "stats-bar"
  items: StatItem[]
}

export interface FeatureCard {
  title: string
  description: string
}

export interface FeatureCardsSection {
  type: "feature-cards"
  heading: string
  description?: string
  cards: FeatureCard[]
}

export interface CtaBannerSection {
  type: "cta-banner"
  heading: string
  description?: string
}

export interface ChecklistItem {
  text: string
}

export interface ChecklistSection {
  type: "checklist"
  heading: string
  items: ChecklistItem[]
}

export interface AlternatingBlock {
  heading: string
  description: string
}

export interface AlternatingBlocksSection {
  type: "alternating-blocks"
  heading?: string
  blocks: AlternatingBlock[]
}

export interface SectionHeading {
  type: "section-heading"
  heading: string
  description?: string
}

export type FeaturePageSection =
  | HeroSection
  | RoleCardsSection
  | BenefitsGridSection
  | StatsBarSection
  | FeatureCardsSection
  | CtaBannerSection
  | ChecklistSection
  | AlternatingBlocksSection
  | SectionHeading

export interface FeaturePageData {
  sections: FeaturePageSection[]
  relatedFeatures?: string[]
}

// ─── Showcase (zenda Services–style sticky deck) ───

export interface ShowcaseCard {
  /** Pill label, e.g. "DIRECTORY". */
  tag: string
  /** Lucide icon name resolved via getIconComponent. */
  icon: string
  title: string
  description: string
  /** Product screenshot under public/, e.g. /features/shots/students.png. */
  image: string
  width: number
  height: number
}

export interface ShowcaseData {
  /** Small tag above the heading, e.g. the feature title. */
  eyebrow: string
  /** Section heading; "\n" splits lines. */
  heading: string
  cards: ShowcaseCard[]
}

// ─── Why band (apple why-Mac–style gallery) ───

export interface WhyCard {
  id: string
  topic: string
  headline: string
  body: string
  /** Product screenshot under public/. */
  image: string
  /** Locale-relative href, e.g. "/pricing" → `/${lang}/pricing`. */
  href: string
  /** CSS object-position for the cropped image; defaults to "center top". */
  objectPosition?: string
}
