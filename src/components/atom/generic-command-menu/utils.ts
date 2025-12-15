import type { RecentItem, Role, SearchContext, SearchItem } from "./types"

const RECENT_ITEMS_KEY = "command-menu-recent"
const MAX_RECENT_ITEMS = 10

/**
 * Filter search items by user role
 */
export function filterByRole(items: SearchItem[], role?: Role): SearchItem[] {
  if (!role) return items

  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.includes(role)
  })
}

/**
 * Get contextual suggestions based on current path
 */
export function getContextualSuggestions(
  items: SearchItem[],
  context: SearchContext
): SearchItem[] {
  if (!context.currentPath) return items

  const pathSegments = context.currentPath.split("/").filter(Boolean)
  const currentSection = pathSegments[pathSegments.length - 1]

  return items.filter((item) => {
    if (!item.keywords) return false
    return item.keywords.some((keyword) =>
      currentSection?.includes(keyword.toLowerCase())
    )
  })
}

/**
 * Get recent items from localStorage
 */
export function getRecentItems(): RecentItem[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY)
    if (!stored) return []

    const items: RecentItem[] = JSON.parse(stored)

    // Filter out items older than 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const validItems = items.filter((item) => item.timestamp > thirtyDaysAgo)

    // Sort by timestamp (most recent first)
    return validItems.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error("Failed to get recent items:", error)
    return []
  }
}

/**
 * Save a recent item to localStorage
 */
export function saveRecentItem(item: Omit<RecentItem, "timestamp">): void {
  if (typeof window === "undefined") return

  try {
    const recent = getRecentItems()

    // Remove existing entry if present
    const filtered = recent.filter((r) => r.id !== item.id)

    // Add new item at the beginning
    const newRecent: RecentItem[] = [
      { ...item, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS)

    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(newRecent))
  } catch (error) {
    console.error("Failed to save recent item:", error)
  }
}

/**
 * Clear all recent items
 */
export function clearRecentItems(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(RECENT_ITEMS_KEY)
  } catch (error) {
    console.error("Failed to clear recent items:", error)
  }
}

/**
 * Filter items by search query
 */
export function filterByQuery(
  items: SearchItem[],
  query: string
): SearchItem[] {
  if (!query) return items

  const lowerQuery = query.toLowerCase()

  return items.filter((item) => {
    // Match title
    if (item.title.toLowerCase().includes(lowerQuery)) return true

    // Match description
    if (item.description?.toLowerCase().includes(lowerQuery)) return true

    // Match keywords
    if (item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery)))
      return true

    // Match breadcrumb
    if (item.breadcrumb?.some((b) => b.toLowerCase().includes(lowerQuery)))
      return true

    return false
  })
}

/**
 * Convert recent items to search items
 */
export function recentItemsToSearchItems(
  recentItems: RecentItem[]
): SearchItem[] {
  return recentItems.map((item) => ({
    id: item.id,
    title: item.title,
    type: "recent" as const,
    href: item.href,
  }))
}
