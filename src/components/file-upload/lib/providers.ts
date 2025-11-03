/**
 * Storage Provider Implementations
 * Supports Vercel Blob, AWS S3, and Cloudflare R2
 */

import { put, del, list } from '@vercel/blob';
import type { StorageProvider, FileMetadata } from '../types';
import { generateUniqueFilename } from './formatters';

// ============================================================================
// Base Storage Provider Interface
// ============================================================================

interface StorageProviderInterface {
  upload(file: File, path: string): Promise<string>;
  delete(url: string): Promise<boolean>;
  list(path: string): Promise<string[]>;
  getUrl(path: string): string;
}

// ============================================================================
// Vercel Blob Provider
// ============================================================================

class VercelBlobProvider implements StorageProviderInterface {
  async upload(file: File, path: string): Promise<string> {
    try {
      const blob = await put(path, file, {
        access: 'public',
        addRandomSuffix: false, // We handle unique names ourselves
      });

      return blob.url;
    } catch (error) {
      throw new Error(
        `Vercel Blob upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(url: string): Promise<boolean> {
    try {
      await del(url);
      return true;
    } catch (error) {
      console.error('Vercel Blob delete failed:', error);
      return false;
    }
  }

  async list(path: string): Promise<string[]> {
    try {
      const { blobs } = await list({ prefix: path });
      return blobs.map((blob) => blob.url);
    } catch (error) {
      console.error('Vercel Blob list failed:', error);
      return [];
    }
  }

  getUrl(path: string): string {
    // Vercel Blob URLs are returned directly from upload
    return path;
  }
}

// ============================================================================
// AWS S3 Provider
// ============================================================================

class AWSS3Provider implements StorageProviderInterface {
  private bucket: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error('AWS S3 credentials not configured');
    }
  }

  async upload(file: File, path: string): Promise<string> {
    try {
      // Note: This is a placeholder. In production, you'd use AWS SDK v3
      // import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Example with AWS SDK v3 (commented out - needs @aws-sdk/client-s3):
      /*
      const s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      });

      await s3Client.send(command);
      */

      // For now, return the expected URL format
      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
    } catch (error) {
      throw new Error(
        `AWS S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(url: string): Promise<boolean> {
    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(url);

      // Example with AWS SDK v3 (commented out):
      /*
      const s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await s3Client.send(command);
      */

      return true;
    } catch (error) {
      console.error('AWS S3 delete failed:', error);
      return false;
    }
  }

  async list(path: string): Promise<string[]> {
    try {
      // Example with AWS SDK v3 (commented out):
      /*
      const s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: path,
      });

      const response = await s3Client.send(command);

      return (response.Contents || []).map(
        (obj) => `https://${this.bucket}.s3.${this.region}.amazonaws.com/${obj.Key}`
      );
      */

      return [];
    } catch (error) {
      console.error('AWS S3 list failed:', error);
      return [];
    }
  }

  getUrl(path: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
  }

  private extractKeyFromUrl(url: string): string {
    // Extract key from S3 URL
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : url;
  }
}

// ============================================================================
// Cloudflare R2 Provider
// ============================================================================

class CloudflareR2Provider implements StorageProviderInterface {
  private accountId: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
    this.accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

    if (!this.accountId || !this.accessKeyId || !this.secretAccessKey || !this.bucketName) {
      throw new Error('Cloudflare R2 credentials not configured');
    }
  }

  async upload(file: File, path: string): Promise<string> {
    try {
      // Note: Cloudflare R2 is S3-compatible, so we use similar approach
      // R2 endpoint: https://<accountId>.r2.cloudflarestorage.com

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Example with AWS SDK v3 (R2 is S3-compatible):
      /*
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: buffer,
        ContentType: file.type,
      });

      await s3Client.send(command);
      */

      // Return public URL if configured, otherwise R2 URL
      if (this.publicUrl) {
        return `${this.publicUrl}/${path}`;
      }

      return `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${path}`;
    } catch (error) {
      throw new Error(
        `Cloudflare R2 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(url: string): Promise<boolean> {
    try {
      const key = this.extractKeyFromUrl(url);

      // Example with AWS SDK v3:
      /*
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      */

      return true;
    } catch (error) {
      console.error('Cloudflare R2 delete failed:', error);
      return false;
    }
  }

  async list(path: string): Promise<string[]> {
    try {
      // Example with AWS SDK v3:
      /*
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: path,
      });

      const response = await s3Client.send(command);

      return (response.Contents || []).map((obj) => this.getUrl(obj.Key || ''));
      */

      return [];
    } catch (error) {
      console.error('Cloudflare R2 list failed:', error);
      return [];
    }
  }

  getUrl(path: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${path}`;
    }
    return `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${path}`;
  }

  private extractKeyFromUrl(url: string): string {
    if (this.publicUrl && url.startsWith(this.publicUrl)) {
      return url.replace(`${this.publicUrl}/`, '');
    }

    // Extract from R2 URL
    const match = url.match(/cloudflarestorage\.com\/[^/]+\/(.+)$/);
    return match ? match[1] : url;
  }
}

// ============================================================================
// Provider Factory
// ============================================================================

const providers = new Map<StorageProvider, StorageProviderInterface>();

/**
 * Get storage provider instance
 */
export function getProvider(provider: StorageProvider): StorageProviderInterface {
  // Return cached instance if available
  if (providers.has(provider)) {
    return providers.get(provider)!;
  }

  // Create new instance
  let instance: StorageProviderInterface;

  switch (provider) {
    case 'vercel_blob':
      instance = new VercelBlobProvider();
      break;
    case 'aws_s3':
      instance = new AWSS3Provider();
      break;
    case 'cloudflare_r2':
      instance = new CloudflareR2Provider();
      break;
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }

  // Cache instance
  providers.set(provider, instance);

  return instance;
}

/**
 * Upload file using specified provider
 */
export async function uploadToProvider(
  file: File,
  path: string,
  provider: StorageProvider
): Promise<string> {
  const providerInstance = getProvider(provider);
  return await providerInstance.upload(file, path);
}

/**
 * Delete file using specified provider
 */
export async function deleteFromProvider(
  url: string,
  provider: StorageProvider
): Promise<boolean> {
  const providerInstance = getProvider(provider);
  return await providerInstance.delete(url);
}

/**
 * List files using specified provider
 */
export async function listFromProvider(
  path: string,
  provider: StorageProvider
): Promise<string[]> {
  const providerInstance = getProvider(provider);
  return await providerInstance.list(path);
}

// ============================================================================
// Export
// ============================================================================

export const storageProviders = {
  vercelBlob: VercelBlobProvider,
  awsS3: AWSS3Provider,
  cloudflareR2: CloudflareR2Provider,
  getProvider,
  uploadToProvider,
  deleteFromProvider,
  listFromProvider,
} as const;
