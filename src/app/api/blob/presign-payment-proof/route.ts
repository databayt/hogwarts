// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Presigned URL API — payment-proof upload (Bankak / Cashi / bank transfer).
 *
 * Sudan's rails have no merchant API (see src/lib/payment/providers/bankak.ts),
 * so a payer proves a transfer by uploading the confirmation screenshot from
 * their own banking app. This mints a short-lived presigned PUT so those bytes
 * never touch the server.
 *
 * Deliberately different from ../presign (the video route) in two ways:
 *  - Role gate: ANY authenticated user in the tenant may upload, because the
 *    whole point is that a parent files this, not staff. Ownership of the
 *    specific fee assignment is enforced later, by `submitManualPaymentProof`,
 *    which is what actually creates the Payment row — a stray object in S3
 *    with no Payment attached is inert.
 *  - Types/size: images + PDF at a few MB, not 5GB of video.
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

/** A transfer screenshot is a phone screengrab or a one-page PDF. */
const MAX_PROOF_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]
const PRESIGNED_URL_EXPIRY = 15 * 60 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return NextResponse.json(
        { error: "School context required" },
        { status: 400 }
      )
    }

    const body = (await request.json()) as {
      filename?: string
      contentType?: string
      size?: number
      feeAssignmentId?: string
    }
    const { filename, contentType, size, feeAssignmentId } = body

    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { error: "Missing required fields: filename, contentType, size" },
        { status: 400 }
      )
    }

    if (!ALLOWED_PROOF_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type: ${contentType}` },
        { status: 400 }
      )
    }

    if (size > MAX_PROOF_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 10MB limit" },
        { status: 400 }
      )
    }

    const client = getS3Client()
    if (!client) {
      return NextResponse.json({ error: "S3 not configured" }, { status: 500 })
    }

    // Tenant-prefixed key so one school's proofs can never collide with or be
    // guessed from another's. The scope segment is the assignment when known.
    const timestamp = Date.now()
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_").slice(-80)
    const scope = (feeAssignmentId ?? "unscoped").replace(/[^a-zA-Z0-9-]/g, "")
    const key = `payment-proof/${schoolId}/${scope}/${timestamp}_${sanitizedName}`
    const bucket = process.env.AWS_S3_BUCKET!

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

    const domain = process.env.CLOUDFRONT_DOMAIN
    const finalUrl = domain
      ? `https://${domain}/${key}`
      : `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`

    return NextResponse.json({
      presignedUrl,
      finalUrl,
      key,
      expiresIn: PRESIGNED_URL_EXPIRY,
    })
  } catch (error) {
    console.error("Payment-proof presign failed:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
