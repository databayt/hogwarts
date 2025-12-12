/**
 * Storage Provider - Base Interface
 * Abstract interface for all storage providers
 */

import type { StorageProvider } from "../types";

export interface UploadProviderOptions {
  contentType?: string;
  access?: "public" | "private";
  metadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
}

export interface StorageProviderInterface {
  /**
   * Get provider name
   */
  getName(): StorageProvider;

  /**
   * Upload a file and return the public URL
   */
  upload(file: File | Blob, path: string, options?: UploadProviderOptions): Promise<string>;

  /**
   * Delete a file by URL or path
   */
  delete(urlOrPath: string): Promise<boolean>;

  /**
   * List files in a path
   */
  list(path: string, limit?: number): Promise<string[]>;

  /**
   * Get signed URL for private access
   */
  getSignedUrl?(url: string, expiresIn?: number): Promise<string>;

  /**
   * Check if provider supports a feature
   */
  supports(feature: "streaming" | "signed_urls" | "direct_upload" | "transformations"): boolean;

  /**
   * Get file metadata
   */
  getMetadata?(url: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  } | null>;
}

/**
 * Base provider class with common functionality
 */
export abstract class BaseStorageProvider implements StorageProviderInterface {
  protected abstract providerName: StorageProvider;

  getName(): StorageProvider {
    return this.providerName;
  }

  abstract upload(file: File | Blob, path: string, options?: UploadProviderOptions): Promise<string>;

  abstract delete(urlOrPath: string): Promise<boolean>;

  async list(_path: string, _limit?: number): Promise<string[]> {
    // Default implementation returns empty array
    // Override in providers that support listing
    return [];
  }

  supports(_feature: "streaming" | "signed_urls" | "direct_upload" | "transformations"): boolean {
    return false;
  }

  async getMetadata(_url: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  } | null> {
    return null;
  }
}
