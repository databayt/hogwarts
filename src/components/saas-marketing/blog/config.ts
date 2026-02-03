/**
 * Constants for Marketing Blog
 *
 * Static configuration for blog categories, authors, and settings.
 */

import type { BlogCategory, BlogCategoryInfo } from "./types"

/**
 * Available blog categories
 */
export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  "product-updates",
  "education-tech",
  "best-practices",
  "case-studies",
  "tutorials",
  "announcements",
] as const

/**
 * Blog category information
 */
export const BLOG_CATEGORY_INFO: Record<BlogCategory, BlogCategoryInfo> = {
  "product-updates": {
    id: "product-updates",
    label: "Product Updates",
    description: "Latest features and improvements",
    color: "bg-blue-500",
  },
  "education-tech": {
    id: "education-tech",
    label: "Education Technology",
    description: "Insights on edtech trends and innovation",
    color: "bg-purple-500",
  },
  "best-practices": {
    id: "best-practices",
    label: "Best Practices",
    description: "Tips and strategies for school management",
    color: "bg-green-500",
  },
  "case-studies": {
    id: "case-studies",
    label: "Case Studies",
    description: "Success stories from our schools",
    color: "bg-orange-500",
  },
  tutorials: {
    id: "tutorials",
    label: "Tutorials",
    description: "Step-by-step guides and how-tos",
    color: "bg-indigo-500",
  },
  announcements: {
    id: "announcements",
    label: "Announcements",
    description: "Company news and updates",
    color: "bg-pink-500",
  },
} as const

/**
 * Default pagination settings
 */
export const DEFAULT_POSTS_PER_PAGE = 12
export const POSTS_PER_PAGE_OPTIONS = [6, 12, 24, 48] as const

/**
 * Reading speed (words per minute)
 */
export const WORDS_PER_MINUTE = 200

/**
 * Popular tags (example)
 */
export const POPULAR_TAGS = [
  "automation",
  "attendance",
  "grading",
  "communication",
  "analytics",
  "mobile",
  "integration",
  "security",
] as const

/**
 * Social share platforms
 */
export const SHARE_PLATFORMS = [
  "twitter",
  "facebook",
  "linkedin",
  "email",
] as const

/**
 * Blog post status
 */
export const POST_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  SCHEDULED: "scheduled",
  ARCHIVED: "archived",
} as const

/**
 * Maximum excerpt length
 */
export const MAX_EXCERPT_LENGTH = 160

/**
 * Maximum title length
 */
export const MAX_TITLE_LENGTH = 60

/**
 * Default cover image
 */
export const DEFAULT_COVER_IMAGE = "/images/blog-default.jpg"

/**
 * Author roles
 */
export const AUTHOR_ROLES = {
  FOUNDER: "Founder",
  PRODUCT: "Product Manager",
  ENGINEER: "Software Engineer",
  DESIGNER: "Designer",
  MARKETING: "Marketing Manager",
  EDUCATOR: "Education Specialist",
} as const
