/**
 * ImageKit Storage Provider
 * Optimized for images with transformations and CDN
 */

import ImageKit from "imagekit";
import type { StorageProvider } from "../types";
import { BaseStorageProvider, type UploadProviderOptions } from "./base";

// Lazy initialization to avoid errors when env vars are missing
let imagekitInstance: ImageKit | null = null;

function getImageKit(): ImageKit {
  if (!imagekitInstance) {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error("ImageKit environment variables are not configured");
    }

    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }

  return imagekitInstance;
}

// Transformation presets
export const IMAGE_TRANSFORMATIONS = {
  thumbnail: { width: 100, height: 100, crop: "at_max" as const },
  card: { width: 300, height: 400, crop: "at_max" as const },
  detail: { width: 600, height: 800, crop: "at_max" as const },
  avatar: { width: 200, height: 200, crop: "at_max" as const },
  banner: { width: 1200, height: 400, crop: "at_max" as const },
  logo: { width: 400, height: 400, crop: "at_max" as const },
} as const;

export type TransformationPreset = keyof typeof IMAGE_TRANSFORMATIONS;

export class ImageKitProvider extends BaseStorageProvider {
  protected providerName: StorageProvider = "imagekit";

  supports(feature: "streaming" | "signed_urls" | "direct_upload" | "transformations"): boolean {
    return feature === "transformations" || feature === "direct_upload";
  }

  async upload(file: File | Blob, path: string, options?: UploadProviderOptions): Promise<string> {
    try {
      const imagekit = getImageKit();

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // Extract folder and filename from path
      const lastSlash = path.lastIndexOf("/");
      const folder = lastSlash > 0 ? path.substring(0, lastSlash) : "/";
      const fileName = lastSlash > 0 ? path.substring(lastSlash + 1) : path;

      const result = await imagekit.upload({
        file: base64,
        fileName,
        folder,
        useUniqueFileName: false,
        tags: options?.metadata ? Object.values(options.metadata) : undefined,
      });

      return result.url;
    } catch (error) {
      console.error("[ImageKitProvider] Upload error:", error);
      throw new Error(
        `Failed to upload to ImageKit: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async delete(urlOrPath: string): Promise<boolean> {
    try {
      const imagekit = getImageKit();

      // Extract file ID from URL or use path directly
      const fileId = this.extractFileId(urlOrPath);
      if (!fileId) {
        console.error("[ImageKitProvider] Could not extract file ID from:", urlOrPath);
        return false;
      }

      await imagekit.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error("[ImageKitProvider] Delete error:", error);
      return false;
    }
  }

  async list(path: string, limit: number = 100): Promise<string[]> {
    try {
      const imagekit = getImageKit();

      const files = await imagekit.listFiles({
        path,
        limit,
      });

      return files
        .filter((file): file is typeof file & { url: string } => "url" in file && typeof file.url === "string")
        .map((file) => file.url);
    } catch (error) {
      console.error("[ImageKitProvider] List error:", error);
      return [];
    }
  }

  /**
   * Get transformed URL with preset
   */
  getTransformedUrl(url: string, preset: TransformationPreset): string {
    const transformation = IMAGE_TRANSFORMATIONS[preset];

    try {
      const imagekit = getImageKit();
      return imagekit.url({
        src: url,
        transformation: [transformation],
      });
    } catch {
      // If ImageKit is not configured, return original URL
      return url;
    }
  }

  /**
   * Get authentication parameters for client-side uploads
   */
  async getAuthenticationParameters(): Promise<{
    token: string;
    expire: number;
    signature: string;
  }> {
    const imagekit = getImageKit();
    return imagekit.getAuthenticationParameters();
  }

  private extractFileId(urlOrPath: string): string | null {
    // ImageKit URLs contain the file ID in the path
    // Example: https://ik.imagekit.io/abdout/folder/file_abc123.jpg
    // The file ID would need to be looked up via the API

    // For now, we'll need to use the file path to find and delete
    // This is a limitation - ideally we'd store the fileId in our database
    try {
      const url = new URL(urlOrPath);
      const pathParts = url.pathname.split("/").filter(Boolean);
      // Return the last part (filename) as a fallback
      return pathParts[pathParts.length - 1] || null;
    } catch {
      return urlOrPath;
    }
  }
}

// Export singleton helper
let provider: ImageKitProvider | null = null;

export function getImageKitProvider(): ImageKitProvider {
  if (!provider) {
    provider = new ImageKitProvider();
  }
  return provider;
}
