/**
 * Type definitions for Marketing Blog
 *
 * Types for blog posts, authors, and content management.
 */

/**
 * Blog post
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: Author;
  category: BlogCategory;
  tags: string[];
  publishedAt: Date;
  updatedAt?: Date;
  readingTime: number;
  featured?: boolean;
  seo?: SEOMetadata;
}

/**
 * Author information
 */
export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  role?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

/**
 * Blog category
 */
export type BlogCategory =
  | "product-updates"
  | "education-tech"
  | "best-practices"
  | "case-studies"
  | "tutorials"
  | "announcements";

/**
 * SEO metadata
 */
export interface SEOMetadata {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string[];
  canonicalUrl?: string;
}

/**
 * Blog post list item (minimal data for listings)
 */
export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  authorAvatar?: string;
  category: BlogCategory;
  publishedAt: Date;
  readingTime: number;
  featured?: boolean;
}

/**
 * Blog category info
 */
export interface BlogCategoryInfo {
  id: BlogCategory;
  label: string;
  description: string;
  color: string;
}

/**
 * Blog filters
 */
export interface BlogFilters {
  category?: BlogCategory;
  tag?: string;
  author?: string;
  search?: string;
}

/**
 * Blog pagination
 */
export interface BlogPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
