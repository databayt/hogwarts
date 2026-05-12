// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LucideIcon } from "lucide-react"

// User roles from school-dashboard config
export type Role =
  | "DEVELOPER"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT"
  | "STAFF"
  | "USER"

// Type of search item
export type SearchItemType = "navigation" | "action" | "setting" | "recent"

// Individual search item
export interface SearchItem {
  id: string
  title: string
  type: SearchItemType
  icon?: LucideIcon
  href?: string
  action?: () => void
  breadcrumb?: string[]
  shortcut?: string
  roles?: Role[]
  keywords?: string[]
  description?: string
  /**
   * Optional entity kind. Set when the item came from a dynamic search
   * result (or from a recent that started life as one) so the renderer
   * picks the right icon from `kindIconMap`. Static nav/action items
   * leave this undefined.
   */
  kind?: SpotlightGroupKind
}

// Group of search items
export interface SearchGroup {
  title: string
  items: SearchItem[]
}

// Configuration for search component
export interface SearchConfig {
  navigation?: SearchItem[]
  actions?: SearchItem[]
  settings?: SearchItem[]
  showRecent?: boolean
  maxRecent?: number
  placeholder?: string
  emptyMessage?: string
}

// Recent item stored in localStorage
export interface RecentItem {
  id: string
  title: string
  href: string
  timestamp: number
  /**
   * Entity kind for dynamic recents (student, teacher, …). Optional — old
   * localStorage payloads predate this field and fall back to a generic icon.
   */
  kind?: SpotlightGroupKind
  /** Serialized icon key so dynamic recents render with their entity icon. */
  iconKey?: string
}

// Context for filtering search results
export interface SearchContext {
  currentPath?: string
  currentRole?: Role
  schoolId?: string
  locale?: string
}

/**
 * Entity types the spotlight can search across the school dashboard.
 * Each kind has its own RBAC predicate and result projection. Kept as a
 * string union so it serializes cleanly into cache keys and localStorage.
 */
export type SpotlightGroupKind =
  | "student"
  | "teacher"
  | "guardian"
  | "class"
  | "classroom"
  | "subject"
  | "vehicle"
  | "driver"
  | "route"
  | "application"
  | "payment"
  | "invoice"
  | "book"
  | "announcement"
  | "event"

/**
 * Single dynamic result row returned by the server action. The `label`
 * stays in the entity's stored language (no per-keystroke translation);
 * the `kind` chip is translated client-side via `dictionary.commandMenu.kinds`.
 */
export interface SpotlightResult {
  kind: SpotlightGroupKind
  id: string
  /** Primary text — entity name / number in stored language. */
  label: string
  /** ID, email, plate, amount, etc. — secondary muted text under label. */
  secondaryLabel?: string
  /** Clean URL without `/${locale}` prefix; renderer prepends locale. */
  href: string
  /** Trail like ["Finance", "Payments"] or ["Grade 7"]. */
  breadcrumb?: string[]
  /** Stored language ("ar" | "en") — reserved for future on-demand translation. */
  lang?: "en" | "ar"
}

/** A group of dynamic results for one entity kind. */
export interface SpotlightResultGroup {
  kind: SpotlightGroupKind
  results: SpotlightResult[]
}
