/**
 * Cloudflare R2 Storage Provider
 * Cold storage for archival, S3-compatible API
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type { StorageProvider } from "../types";
import { BaseStorageProvider, type UploadProviderOptions } from "./base";

// Lazy initialization
let r2Client: S3Client | null = null;
let bucketName: string | undefined = undefined;

function getR2Client(): S3Client {
  if (!r2Client) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    bucketName = process.env.CLOUDFLARE_R2_BUCKET;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error("Cloudflare R2 environment variables are not configured");
    }

    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return r2Client;
}

function getBucketName(): string {
  if (!bucketName) {
    bucketName = process.env.CLOUDFLARE_R2_BUCKET;
    if (!bucketName) {
      throw new Error("CLOUDFLARE_R2_BUCKET environment variable is not set");
    }
  }
  return bucketName;
}

export class CloudflareR2Provider extends BaseStorageProvider {
  protected providerName: StorageProvider = "cloudflare_r2";

  supports(feature: "streaming" | "signed_urls" | "direct_upload" | "transformations"): boolean {
    return feature === "streaming";
  }

  async upload(file: File | Blob, path: string, options?: UploadProviderOptions): Promise<string> {
    try {
      const client = getR2Client();
      const bucket = getBucketName();

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: buffer,
        ContentType: options?.contentType || "application/octet-stream",
        Metadata: options?.metadata,
      });

      await client.send(command);

      // R2 public URL format
      const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
      if (publicDomain) {
        return `https://${publicDomain}/${path}`;
      }

      // Fallback to account endpoint
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
      return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${path}`;
    } catch (error) {
      console.error("[CloudflareR2Provider] Upload error:", error);
      throw new Error(
        `Failed to upload to R2: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async delete(urlOrPath: string): Promise<boolean> {
    try {
      const client = getR2Client();
      const bucket = getBucketName();

      const key = this.extractKeyFromUrl(urlOrPath);

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await client.send(command);
      return true;
    } catch (error) {
      console.error("[CloudflareR2Provider] Delete error:", error);
      return false;
    }
  }

  async list(prefix: string, limit: number = 100): Promise<string[]> {
    try {
      const client = getR2Client();
      const bucket = getBucketName();

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: limit,
      });

      const response = await client.send(command);

      const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
      const baseUrl = publicDomain
        ? `https://${publicDomain}`
        : `https://${bucket}.r2.cloudflarestorage.com`;

      return response.Contents?.map((item) => `${baseUrl}/${item.Key}`) || [];
    } catch (error) {
      console.error("[CloudflareR2Provider] List error:", error);
      return [];
    }
  }

  async getMetadata(
    url: string
  ): Promise<{ size: number; contentType: string; lastModified: Date } | null> {
    try {
      const client = getR2Client();
      const bucket = getBucketName();
      const key = this.extractKeyFromUrl(url);

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || "application/octet-stream",
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      console.error("[CloudflareR2Provider] GetMetadata error:", error);
      return null;
    }
  }

  private extractKeyFromUrl(urlOrPath: string): string {
    try {
      const url = new URL(urlOrPath);
      return url.pathname.substring(1);
    } catch {
      return urlOrPath;
    }
  }
}

// Export singleton helper
let provider: CloudflareR2Provider | null = null;

export function getCloudflareR2Provider(): CloudflareR2Provider {
  if (!provider) {
    provider = new CloudflareR2Provider();
  }
  return provider;
}
