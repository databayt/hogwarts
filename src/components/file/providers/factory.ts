/**
 * Storage Provider Factory
 * Selects optimal provider based on file characteristics
 */

import { PROVIDER_CONFIG, TIER_THRESHOLDS } from "../config"
import type { FileCategory, StorageProvider, StorageTier } from "../types"
import { AWSS3Provider } from "./aws-s3"
import type { StorageProviderInterface } from "./base"
import { CloudflareR2Provider } from "./cloudflare-r2"
import { ImageKitProvider } from "./imagekit"
import { VercelBlobProvider } from "./vercel-blob"

// Provider instances cache
const providers = new Map<StorageProvider, StorageProviderInterface>()

/**
 * Selection criteria for choosing a provider
 */
export interface ProviderSelectionCriteria {
  /** File category */
  category: FileCategory
  /** File size in bytes */
  size: number
  /** Preferred storage tier */
  tier?: StorageTier
  /** Special purpose (library, avatar, etc.) */
  purpose?: string
  /** Force specific provider */
  forceProvider?: StorageProvider
}

/**
 * Select the optimal storage provider based on criteria
 */
export function selectProvider(
  criteria: ProviderSelectionCriteria
): StorageProvider {
  const { category, size, tier = "hot", purpose, forceProvider } = criteria

  // If a specific provider is forced, use it
  if (forceProvider) {
    return forceProvider
  }

  // ImageKit for optimized images in specific contexts
  if (
    category === "image" &&
    (purpose === "library" || purpose === "avatar" || purpose === "logo")
  ) {
    // Check if ImageKit is configured
    if (
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_PRIVATE_KEY
    ) {
      return "imagekit"
    }
  }

  // Vercel Blob for small/medium files with frequent access (hot tier)
  if (size < TIER_THRESHOLDS.hot.maxSize && tier === "hot") {
    return "vercel_blob"
  }

  // AWS S3 for large files or videos
  if (category === "video" || size >= TIER_THRESHOLDS.hot.maxSize) {
    // Check if S3 is configured
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET) {
      return "aws_s3"
    }
    // Fall back to Vercel Blob if under limit
    if (size < PROVIDER_CONFIG.vercel_blob.maxSize) {
      return "vercel_blob"
    }
  }

  // Cloudflare R2 for cold storage / archive
  if (tier === "cold") {
    if (
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_BUCKET
    ) {
      return "cloudflare_r2"
    }
  }

  // Warm tier uses S3 if available
  if (
    tier === "warm" &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_S3_BUCKET
  ) {
    return "aws_s3"
  }

  // Default to Vercel Blob
  return "vercel_blob"
}

/**
 * Get or create a provider instance
 */
export function getProvider(
  provider: StorageProvider
): StorageProviderInterface {
  if (!providers.has(provider)) {
    switch (provider) {
      case "vercel_blob":
        providers.set(provider, new VercelBlobProvider())
        break
      case "aws_s3":
        providers.set(provider, new AWSS3Provider())
        break
      case "cloudflare_r2":
        providers.set(provider, new CloudflareR2Provider())
        break
      case "imagekit":
        providers.set(provider, new ImageKitProvider())
        break
      default:
        throw new Error(`Unknown storage provider: ${provider}`)
    }
  }

  return providers.get(provider)!
}

/**
 * Get provider by URL pattern matching
 */
export function detectProviderFromUrl(url: string): StorageProvider {
  const urlLower = url.toLowerCase()

  if (urlLower.includes("vercel-blob") || urlLower.includes("vercel.app")) {
    return "vercel_blob"
  }

  if (urlLower.includes("s3.") || urlLower.includes("amazonaws.com")) {
    return "aws_s3"
  }

  if (
    urlLower.includes("r2.cloudflarestorage.com") ||
    urlLower.includes("r2.dev")
  ) {
    return "cloudflare_r2"
  }

  if (urlLower.includes("imagekit.io") || urlLower.includes("ik.imagekit.io")) {
    return "imagekit"
  }

  // Default to Vercel Blob
  return "vercel_blob"
}

/**
 * Check if a provider is available (configured)
 */
export function isProviderAvailable(provider: StorageProvider): boolean {
  switch (provider) {
    case "vercel_blob":
      return !!process.env.BLOB_READ_WRITE_TOKEN
    case "aws_s3":
      return !!(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_S3_BUCKET
      )
    case "cloudflare_r2":
      return !!(
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
        process.env.CLOUDFLARE_R2_BUCKET
      )
    case "imagekit":
      return !!(
        process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY &&
        process.env.IMAGEKIT_PRIVATE_KEY &&
        process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
      )
    default:
      return false
  }
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): StorageProvider[] {
  const allProviders: StorageProvider[] = [
    "vercel_blob",
    "aws_s3",
    "cloudflare_r2",
    "imagekit",
  ]
  return allProviders.filter(isProviderAvailable)
}

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: StorageProvider) {
  return PROVIDER_CONFIG[provider]
}
