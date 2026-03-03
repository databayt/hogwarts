// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Profile Images Seed
 *
 * Reads HP character images from /public/site/,
 * processes via Sharp -> WebP, uploads to S3/CloudFront,
 * and updates User.image + role profilePhotoUrl.
 *
 * Usage: pnpm db:seed:single profile-images
 */

import fs from "fs"
import path from "path"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import type { PrismaClient } from "@prisma/client"

import { HP_CHARACTERS } from "./constants"
import { logSuccess } from "./utils"

const IMAGES_DIR = path.resolve(__dirname, "../../public/site")

// Account email -> HP_CHARACTERS key
const ACCOUNT_MAP: Array<{
  email: string
  role: "teacher" | "student" | "guardian" | "staffMember"
  hpKey: keyof typeof HP_CHARACTERS
}> = [
  { email: "teacher@databayt.org", role: "teacher", hpKey: "teacher" },
  { email: "student@databayt.org", role: "student", hpKey: "student" },
  { email: "parent@databayt.org", role: "guardian", hpKey: "guardian0" },
  { email: "parent1@databayt.org", role: "guardian", hpKey: "guardian1" },
  { email: "staff@databayt.org", role: "staffMember", hpKey: "staff" },
]

// Admin accounts (no role model, just User.image)
const ADMIN_MAP: Array<{
  email: string
  hpKey: keyof typeof HP_CHARACTERS
}> = [
  { email: "dev@databayt.org", hpKey: "dev" },
  { email: "admin@databayt.org", hpKey: "admin" },
  { email: "accountant@databayt.org", hpKey: "accountant" },
  { email: "user@databayt.org", hpKey: "user" },
]

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

function getCloudFrontUrl(s3Key: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN
  if (domain) return `https://${domain}/${s3Key}`
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_REGION || "us-east-1"
  return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`
}

async function processAndUpload(
  imagePath: string,
  s3Key: string
): Promise<string> {
  // Dynamic import sharp (ESM)
  const sharp = (await import("sharp")).default

  const input = fs.readFileSync(imagePath)

  // Process to WebP, 256x256 for avatars
  const webpBuffer = await sharp(input)
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer()

  const client = getS3Client()
  const bucket = process.env.AWS_S3_BUCKET!

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: webpBuffer,
      ContentType: "image/webp",
      ACL: "public-read",
    })
  )

  return getCloudFrontUrl(s3Key)
}

export async function seedProfileImages(prisma: PrismaClient): Promise<void> {
  let count = 0

  // Process admin accounts (User.image only)
  for (const account of ADMIN_MAP) {
    const hp = HP_CHARACTERS[account.hpKey]
    const filename = hp.sourceImage.replace("/public/site/", "")
    const imagePath = path.join(IMAGES_DIR, filename)

    if (!fs.existsSync(imagePath)) {
      console.log(`  [skip] ${filename} not found for ${account.email}`)
      continue
    }

    const s3Key = `avatars/${account.email.split("@")[0]}.webp`

    try {
      const url = await processAndUpload(imagePath, s3Key)

      // Update User.image
      await prisma.user.updateMany({
        where: { email: account.email },
        data: { image: url },
      })

      console.log(`  [ok] ${account.email} → ${s3Key}`)
      count++
    } catch (error) {
      console.error(
        `  [err] ${account.email}:`,
        error instanceof Error ? error.message : error
      )
    }
  }

  // Get demo school
  const school = await prisma.school.findFirst({
    where: { domain: "demo" },
    select: { id: true },
  })

  if (!school) {
    console.log("  [skip] Demo school not found")
    return
  }

  const schoolId = school.id

  // Process role accounts (User.image + role profilePhotoUrl)
  for (const account of ACCOUNT_MAP) {
    const hp = HP_CHARACTERS[account.hpKey]
    const filename = hp.sourceImage.replace("/public/site/", "")
    const imagePath = path.join(IMAGES_DIR, filename)

    if (!fs.existsSync(imagePath)) {
      console.log(`  [skip] ${filename} not found for ${account.email}`)
      continue
    }

    const s3Key = `avatars/${account.email.split("@")[0]}.webp`

    try {
      const url = await processAndUpload(imagePath, s3Key)

      // Find user
      const user = await prisma.user.findFirst({
        where: { email: account.email, schoolId },
        select: { id: true },
      })

      if (!user) {
        console.log(`  [skip] User ${account.email} not found`)
        continue
      }

      // Update User.image
      await prisma.user.update({
        where: { id: user.id },
        data: { image: url },
      })

      // Update role model profilePhotoUrl
      if (account.role === "teacher") {
        await prisma.teacher.updateMany({
          where: { userId: user.id, schoolId },
          data: { profilePhotoUrl: url },
        })
      } else if (account.role === "student") {
        await prisma.student.updateMany({
          where: { userId: user.id, schoolId },
          data: { profilePhotoUrl: url },
        })
      } else if (account.role === "guardian") {
        await prisma.guardian.updateMany({
          where: { userId: user.id, schoolId },
          data: { profilePhotoUrl: url },
        })
      } else if (account.role === "staffMember") {
        await prisma.staffMember.updateMany({
          where: { userId: user.id, schoolId },
          data: { profilePhotoUrl: url },
        })
      }

      console.log(`  [ok] ${account.email} → ${s3Key}`)
      count++
    } catch (error) {
      console.error(
        `  [err] ${account.email}:`,
        error instanceof Error ? error.message : error
      )
    }
  }

  logSuccess("Profile Images", count, "S3/CloudFront WebP avatars")
}
