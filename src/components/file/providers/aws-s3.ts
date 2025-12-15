/**
 * AWS S3 Storage Provider
 * Warm storage for large files up to 5GB
 */

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

import type { StorageProvider } from "../types"
import { BaseStorageProvider, type UploadProviderOptions } from "./base"

// Lazy initialization
let s3Client: S3Client | null = null
let bucketName: string | undefined = undefined
let region: string | undefined = undefined

function getS3Client(): S3Client {
  if (!s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    region = process.env.AWS_REGION || "us-east-1"
    bucketName = process.env.AWS_S3_BUCKET

    if (!accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error("AWS S3 environment variables are not configured")
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  return s3Client
}

function getBucketName(): string {
  if (!bucketName) {
    bucketName = process.env.AWS_S3_BUCKET
    if (!bucketName) {
      throw new Error("AWS_S3_BUCKET environment variable is not set")
    }
  }
  return bucketName
}

export class AWSS3Provider extends BaseStorageProvider {
  protected providerName: StorageProvider = "aws_s3"

  supports(
    feature: "streaming" | "signed_urls" | "direct_upload" | "transformations"
  ): boolean {
    return feature === "signed_urls" || feature === "streaming"
  }

  async upload(
    file: File | Blob,
    path: string,
    options?: UploadProviderOptions
  ): Promise<string> {
    try {
      const client = getS3Client()
      const bucket = getBucketName()

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: buffer,
        ContentType: options?.contentType || "application/octet-stream",
        ACL: options?.access === "private" ? "private" : "public-read",
        Metadata: options?.metadata,
      })

      await client.send(command)

      // Return the public URL
      const currentRegion = process.env.AWS_REGION || "us-east-1"
      return `https://${bucket}.s3.${currentRegion}.amazonaws.com/${path}`
    } catch (error) {
      console.error("[AWSS3Provider] Upload error:", error)
      throw new Error(
        `Failed to upload to S3: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  async delete(urlOrPath: string): Promise<boolean> {
    try {
      const client = getS3Client()
      const bucket = getBucketName()

      // Extract key from URL if it's a full URL
      const key = this.extractKeyFromUrl(urlOrPath)

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })

      await client.send(command)
      return true
    } catch (error) {
      console.error("[AWSS3Provider] Delete error:", error)
      return false
    }
  }

  async list(prefix: string, limit: number = 100): Promise<string[]> {
    try {
      const client = getS3Client()
      const bucket = getBucketName()

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: limit,
      })

      const response = await client.send(command)
      const currentRegion = process.env.AWS_REGION || "us-east-1"

      return (
        response.Contents?.map(
          (item) =>
            `https://${bucket}.s3.${currentRegion}.amazonaws.com/${item.Key}`
        ) || []
      )
    } catch (error) {
      console.error("[AWSS3Provider] List error:", error)
      return []
    }
  }

  async getMetadata(
    url: string
  ): Promise<{ size: number; contentType: string; lastModified: Date } | null> {
    try {
      const client = getS3Client()
      const bucket = getBucketName()
      const key = this.extractKeyFromUrl(url)

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })

      const response = await client.send(command)

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || "application/octet-stream",
        lastModified: response.LastModified || new Date(),
      }
    } catch (error) {
      console.error("[AWSS3Provider] GetMetadata error:", error)
      return null
    }
  }

  private extractKeyFromUrl(urlOrPath: string): string {
    try {
      const url = new URL(urlOrPath)
      // Remove leading slash
      return url.pathname.substring(1)
    } catch {
      // If it's not a URL, assume it's already a key
      return urlOrPath
    }
  }
}

// Export singleton helper
let provider: AWSS3Provider | null = null

export function getAWSS3Provider(): AWSS3Provider {
  if (!provider) {
    provider = new AWSS3Provider()
  }
  return provider
}
