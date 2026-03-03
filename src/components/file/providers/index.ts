// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Storage Providers - Public Exports
 */

// Base types and interfaces
export {
  BaseStorageProvider,
  type StorageProviderInterface,
  type UploadProviderOptions,
} from "./base"

// Provider implementations
export { AWSS3Provider, getAWSS3Provider } from "./aws-s3"
export { CloudflareR2Provider, getCloudflareR2Provider } from "./cloudflare-r2"

// Factory functions
export {
  selectProvider,
  getProvider,
  detectProviderFromUrl,
  isProviderAvailable,
  getAvailableProviders,
  getProviderConfig,
  type ProviderSelectionCriteria,
} from "./factory"
