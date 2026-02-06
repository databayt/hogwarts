/**
 * Presigned URL API — Direct-to-S3 upload for large videos
 *
 * Client requests a presigned PUT URL, then uploads directly to S3.
 * This bypasses the server for file bytes, avoiding memory/timeout issues
 * for large video files (>100MB up to 5GB).
 *
 * Flow:
 * 1. Client POST /api/blob/presign with { filename, contentType, size }
 * 2. Server generates presigned S3 PUT URL (15 min expiry)
 * 3. Client uploads directly to S3 via PUT with presigned URL
 * 4. Client sends final URL back to lesson form
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { getTenantContext } from "@/lib/tenant-context"

let s3Client: S3Client | null = null

function getS3Client(): S3Client | null {
  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_S3_BUCKET
  ) {
    return null
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3Client
}

const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]
const PRESIGNED_URL_EXPIRY = 15 * 60 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // 2. Authorization
    if (!["TEACHER", "ADMIN", "DEVELOPER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // 3. Multi-tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId && session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "School context required" },
        { status: 400 }
      )
    }

    // 4. Parse request body
    const body = await request.json()
    const { filename, contentType, size } = body as {
      filename: string
      contentType: string
      size: number
    }

    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { error: "Missing required fields: filename, contentType, size" },
        { status: 400 }
      )
    }

    // 5. Validate content type
    if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type: ${contentType}` },
        { status: 400 }
      )
    }

    // 6. Validate size
    if (size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size of 5GB" },
        { status: 400 }
      )
    }

    // 7. Check S3 configuration
    const client = getS3Client()
    if (!client) {
      return NextResponse.json(
        { error: "S3 not configured for direct uploads" },
        { status: 500 }
      )
    }

    // 8. Generate S3 key
    const timestamp = Date.now()
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
    const key = `stream/${schoolId ?? "platform"}/video/${timestamp}_${sanitizedName}`
    const bucket = process.env.AWS_S3_BUCKET!

    // 9. Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    })

    // @ts-expect-error - AWS SDK @smithy/types version mismatch between packages
    const presignedUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY,
    })

    // 10. Build the final URL (CloudFront or raw S3)
    const domain = process.env.CLOUDFRONT_DOMAIN
    const finalUrl = domain
      ? `https://${domain}/${key}`
      : `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`

    return NextResponse.json({
      presignedUrl,
      finalUrl,
      key,
      storageProvider: "aws_s3",
      expiresIn: PRESIGNED_URL_EXPIRY,
    })
  } catch (error) {
    console.error("Presigned URL generation failed:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
