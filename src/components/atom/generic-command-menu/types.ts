import type { LucideIcon } from "lucide-react"

// User roles from platform config
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
}

// Context for filtering search results
export interface SearchContext {
  currentPath?: string
  currentRole?: Role
  schoolId?: string
  locale?: string
}
