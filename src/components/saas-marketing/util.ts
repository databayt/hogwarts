/**
 * Utility functions for Marketing components
 *
 * Helper functions for analytics, tracking, and saas-marketing-specific operations.
 */

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(
  originalPrice: number,
  discountedPrice: number
): number {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}

/**
 * Get annual price with discount
 */
export function getAnnualPrice(
  monthlyPrice: number,
  discountPercent = 20
): number {
  const annualPrice = monthlyPrice * 12
  return annualPrice - (annualPrice * discountPercent) / 100
}

/**
 * Format savings amount
 */
export function formatSavings(
  monthlyPrice: number,
  annualPrice: number
): string {
  const monthlyCost = monthlyPrice * 12
  const savings = monthlyCost - annualPrice
  return formatPrice(savings)
}

/**
 * Build UTM tracking URL
 */
export function buildUTMUrl(
  baseUrl: string,
  params: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
): string {
  const url = new URL(baseUrl)

  if (params.source) url.searchParams.set("utm_source", params.source)
  if (params.medium) url.searchParams.set("utm_medium", params.medium)
  if (params.campaign) url.searchParams.set("utm_campaign", params.campaign)
  if (params.term) url.searchParams.set("utm_term", params.term)
  if (params.content) url.searchParams.set("utm_content", params.content)

  return url.toString()
}

/**
 * Extract UTM parameters from URL
 */
export function extractUTMParams(url: string): {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
} {
  const urlObj = new URL(url)
  return {
    source: urlObj.searchParams.get("utm_source") || undefined,
    medium: urlObj.searchParams.get("utm_medium") || undefined,
    campaign: urlObj.searchParams.get("utm_campaign") || undefined,
    term: urlObj.searchParams.get("utm_term") || undefined,
    content: urlObj.searchParams.get("utm_content") || undefined,
  }
}

/**
 * Validate subdomain format
 */
export function isValidSubdomain(subdomain: string): boolean {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
  return (
    subdomain.length >= 3 &&
    subdomain.length <= 50 &&
    subdomainRegex.test(subdomain) &&
    !subdomain.startsWith("-") &&
    !subdomain.endsWith("-")
  )
}

/**
 * Generate subdomain from school name
 */
export function generateSubdomain(schoolName: string): string {
  return schoolName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
}

/**
 * Calculate trial end date
 */
export function getTrialEndDate(days = 14): Date {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)
  return endDate
}

/**
 * Format trial period for display
 */
export function formatTrialPeriod(days: number): string {
  if (days === 7) return "1 week"
  if (days === 14) return "2 weeks"
  if (days === 30) return "1 month"
  return `${days} days`
}

/**
 * Check if email is from educational domain
 */
export function isEducationalEmail(email: string): boolean {
  const eduDomains = [
    ".edu",
    ".ac.",
    ".edu.",
    "school",
    "university",
    "college",
  ]
  return eduDomains.some((domain) => email.toLowerCase().includes(domain))
}

/**
 * Estimate reading time for blog posts
 */
export function estimateReadingTime(
  text: string,
  wordsPerMinute = 200
): number {
  const wordCount = text.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Format reading time
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return "Less than 1 min read"
  if (minutes === 1) return "1 min read"
  return `${minutes} min read`
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

/**
 * Create slug from text
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

/**
 * Get social share URLs
 */
export function getSocialShareUrls(
  url: string,
  title: string
): {
  twitter: string
  facebook: string
  linkedin: string
  email: string
} {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  }
}

/**
 * Track conversion event (wrapper for analytics)
 */
export function trackConversion(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  // In production, integrate with analytics school-dashboard (GA4, Mixpanel, etc.)
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, properties)
  }
}

/**
 * Track page view
 */
export function trackPageView(url: string, title?: string): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: url,
      page_title: title,
    })
  }
}

/**
 * Get pricing tier based on student count
 */
export function getPricingTier(
  studentCount: number
): "starter" | "professional" | "enterprise" {
  if (studentCount <= 100) return "starter"
  if (studentCount <= 500) return "professional"
  return "enterprise"
}

/**
 * Calculate estimated monthly cost
 */
export function estimateMonthlyCost(
  studentCount: number,
  teacherCount: number,
  pricePerStudent = 1,
  pricePerTeacher = 2
): number {
  return studentCount * pricePerStudent + teacherCount * pricePerTeacher
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Check if in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

/**
 * Get base URL for the application
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT || 3000}`
}

// Type augmentation for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void
  }
}
