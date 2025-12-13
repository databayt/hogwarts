/**
 * Vercel Blob Storage Provider
 * Hot storage for files up to 500MB with fast CDN access
 */

import { put, del, list as blobList } from "@vercel/blob";
import type { StorageProvider } from "../types";
import { BaseStorageProvider, type UploadProviderOptions } from "./base";

export class VercelBlobProvider extends BaseStorageProvider {
  protected providerName: StorageProvider = "vercel_blob";

  supports(feature: "streaming" | "signed_urls" | "direct_upload" | "transformations"): boolean {
    return feature === "direct_upload" || feature === "streaming";
  }

  async upload(file: File | Blob, path: string, options?: UploadProviderOptions): Promise<string> {
    try {
      const blob = await put(path, file, {
        access: "public", // Vercel Blob only supports public access in current API
        contentType: options?.contentType,
        addRandomSuffix: false,
      });

      return blob.url;
    } catch (error) {
      console.error("[VercelBlobProvider] Upload error:", error);
      throw new Error(
        `Failed to upload to Vercel Blob: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async delete(url: string): Promise<boolean> {
    try {
      await del(url);
      return true;
    } catch (error) {
      console.error("[VercelBlobProvider] Delete error:", error);
      return false;
    }
  }

  async list(prefix: string, limit: number = 100): Promise<string[]> {
    try {
      const result = await blobList({
        prefix,
        limit,
      });

      return result.blobs.map((blob) => blob.url);
    } catch (error) {
      console.error("[VercelBlobProvider] List error:", error);
      return [];
    }
  }

  async getMetadata(
    url: string
  ): Promise<{ size: number; contentType: string; lastModified: Date } | null> {
    try {
      const result = await blobList({ prefix: url, limit: 1 });
      const blob = result.blobs[0];

      if (!blob) return null;

      return {
        size: blob.size,
        contentType: (blob as { contentType?: string }).contentType || "application/octet-stream",
        lastModified: new Date(blob.uploadedAt),
      };
    } catch (error) {
      console.error("[VercelBlobProvider] GetMetadata error:", error);
      return null;
    }
  }
}
