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

export interface ShowcaseChip {
  /** Lucide icon name resolved via getIconComponent. */
  icon: string
  /** Short UI-echo label, e.g. "Grade 12 · A12" — copy visible in the shot. */
  label: string
}

/** Tuning for a card's composed visual (pastel panel + browser window). */
export interface ShowcaseVisual {
  /** Panel color; defaults cycle the zenda pastel palette by card index. */
  panel?: string
  /** Zoom into the screenshot (1 = full frame, the default). */
  zoom?: number
  /**
   * transform-origin steering the zoom crop — the frame point that stays put
   * while the shot scales up, so higher values reveal content further right
   * and further down. For the standard 1280x1000 dashboard capture, `zoom:
   * 1.29` + `origin: "89% <y>%"` crops the app sidebar away and lands the
   * table's right edge flush; raise the y to skip more page header.
   */
  origin?: string
  /** Floating chips overlapping the window edge (first top-end, second bottom-start; max 2 render). */
  chips?: ShowcaseChip[]
  /** Short factual line for the tinted band at the window's foot. */
  stat?: string
}

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
  /** Composed-visual tuning; omit for the framed full-frame default. */
  visual?: ShowcaseVisual
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
  /** Line-art illustration under public/ (transparent, sits on `panel`). */
  image: string
  /** Locale-relative href, e.g. "/pricing" → `/${lang}/pricing`. */
  href: string
  /** Pastel backdrop behind the art; defaults to a cycled palette entry. */
  panel?: string
}
