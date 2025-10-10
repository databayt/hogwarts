/**
 * Utility functions for Marketing Blog
 *
 * Helper functions for blog post management and display.
 */

import type { BlogPost, BlogPostListItem, BlogCategory, BlogFilters } from "./types";
import { WORDS_PER_MINUTE, MAX_EXCERPT_LENGTH, BLOG_CATEGORY_INFO } from "./config";

/**
 * Calculate reading time
 */
export function calculateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength = MAX_EXCERPT_LENGTH): string {
  // Remove markdown syntax and HTML tags
  const cleanContent = content
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links, keep text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/#{1,6}\s/g, "") // Remove headers
    .trim();

  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  return cleanContent.slice(0, maxLength).trim() + "...";
}

/**
 * Create slug from title
 */
export function createSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Get category label
 */
export function getCategoryLabel(category: BlogCategory): string {
  return BLOG_CATEGORY_INFO[category].label;
}

/**
 * Get category color
 */
export function getCategoryColor(category: BlogCategory): string {
  return BLOG_CATEGORY_INFO[category].color;
}

/**
 * Filter blog posts
 */
export function filterBlogPosts(posts: BlogPost[], filters: BlogFilters): BlogPost[] {
  return posts.filter((post) => {
    if (filters.category && post.category !== filters.category) {
      return false;
    }

    if (filters.tag && !post.tags.includes(filters.tag)) {
      return false;
    }

    if (filters.author && post.author.id !== filters.author) {
      return false;
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = post.title.toLowerCase().includes(searchLower);
      const matchesExcerpt = post.excerpt.toLowerCase().includes(searchLower);
      const matchesTags = post.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      if (!matchesTitle && !matchesExcerpt && !matchesTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort blog posts by date (newest first)
 */
export function sortPostsByDate(posts: BlogPost[], order: "asc" | "desc" = "desc"): BlogPost[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return posts.filter((post) => post.featured === true).slice(0, limit);
}

/**
 * Get related posts
 */
export function getRelatedPosts(post: BlogPost, allPosts: BlogPost[], limit = 3): BlogPost[] {
  // Filter posts with same category or overlapping tags, excluding current post
  const related = allPosts
    .filter((p) => p.id !== post.id)
    .map((p) => {
      let score = 0;

      // Same category gets higher score
      if (p.category === post.category) score += 3;

      // Count overlapping tags
      const overlappingTags = p.tags.filter((tag) => post.tags.includes(tag)).length;
      score += overlappingTags;

      return { post: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);

  return related;
}

/**
 * Get posts by category
 */
export function getPostsByCategory(posts: BlogPost[], category: BlogCategory): BlogPost[] {
  return posts.filter((post) => post.category === category);
}

/**
 * Get posts by tag
 */
export function getPostsByTag(posts: BlogPost[], tag: string): BlogPost[] {
  return posts.filter((post) => post.tags.includes(tag));
}

/**
 * Get posts by author
 */
export function getPostsByAuthor(posts: BlogPost[], authorId: string): BlogPost[] {
  return posts.filter((post) => post.author.id === authorId);
}

/**
 * Format publish date
 */
export function formatPublishDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Format relative date (e.g., "2 days ago")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get all unique tags from posts
 */
export function getAllTags(posts: BlogPost[]): string[] {
  const tagsSet = new Set<string>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}

/**
 * Get tag count
 */
export function getTagCount(posts: BlogPost[], tag: string): number {
  return posts.filter((post) => post.tags.includes(tag)).length;
}

/**
 * Convert blog post to list item
 */
export function toListItem(post: BlogPost): BlogPostListItem {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    authorName: post.author.name,
    authorAvatar: post.author.avatar,
    category: post.category,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    featured: post.featured,
  };
}

/**
 * Paginate posts
 */
export function paginatePosts<T>(posts: T[], page: number, perPage: number): {
  posts: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
} {
  const total = posts.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    posts: posts.slice(start, end),
    pagination: {
      page,
      perPage,
      total,
      totalPages,
    },
  };
}
