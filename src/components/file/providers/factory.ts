// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Storage Provider Factory
 * AWS S3 + CloudFront is the sole storage provider.
 */

import type { FileCategory, StorageProvider, StorageTier } from "../types"
import { AWSS3Provider } from "./aws-s3"
import type { StorageProviderInterface } from "./base"
import { CloudflareR2Provider } from "./cloudflare-r2"

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
  const { tier = "hot", forceProvider } = criteria

  if (forceProvider) {
    return forceProvider
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

  // AWS S3 for everything
  return "aws_s3"
}

/**
 * Get or create a provider instance
 */
export function getProvider(
  provider: StorageProvider
): StorageProviderInterface {
  if (!providers.has(provider)) {
    switch (provider) {
      case "aws_s3":
        providers.set(provider, new AWSS3Provider())
        break
      case "cloudflare_r2":
        providers.set(provider, new CloudflareR2Provider())
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

  if (
    urlLower.includes("r2.cloudflarestorage.com") ||
    urlLower.includes("r2.dev")
  ) {
    return "cloudflare_r2"
  }

  // Default to S3 (includes CloudFront URLs)
  return "aws_s3"
}

/**
 * Check if a provider is available (configured)
 */
export function isProviderAvailable(provider: StorageProvider): boolean {
  switch (provider) {
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
    default:
      return false
  }
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): StorageProvider[] {
  const allProviders: StorageProvider[] = ["aws_s3", "cloudflare_r2"]
  return allProviders.filter(isProviderAvailable)
}

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: StorageProvider) {
  const { PROVIDER_CONFIG } = require("../config")
  return PROVIDER_CONFIG[provider]
}
