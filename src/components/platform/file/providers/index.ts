/**
 * Storage Providers - Public Exports
 */

// Base types and interfaces
export { BaseStorageProvider, type StorageProviderInterface, type UploadProviderOptions } from "./base";

// Provider implementations
export { VercelBlobProvider } from "./vercel-blob";
export { AWSS3Provider, getAWSS3Provider } from "./aws-s3";
export { CloudflareR2Provider, getCloudflareR2Provider } from "./cloudflare-r2";
export {
  ImageKitProvider,
  getImageKitProvider,
  IMAGE_TRANSFORMATIONS,
  type TransformationPreset,
} from "./imagekit";

// Factory functions
export {
  selectProvider,
  getProvider,
  detectProviderFromUrl,
  isProviderAvailable,
  getAvailableProviders,
  getProviderConfig,
  type ProviderSelectionCriteria,
} from "./factory";
