import { readFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = join(
  __dirname,
  "..",
  "public",
  "icons",
  "whatsapp",
  "wp-wa-chat-bg.svg"
)
const KEY = "wallpapers/wp-wa-chat-bg.svg"
const REGION = process.env.AWS_REGION || "us-east-1"
const BUCKET = process.env.AWS_S3_BUCKET || "hogwarts-databayt"
const CDN = process.env.NEXT_PUBLIC_CDN_DOMAIN || process.env.CLOUDFRONT_DOMAIN

const s3 = new S3Client({ region: REGION })
const body = await readFile(FILE)
await s3.send(
  new PutObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
    Body: body,
    ContentType: "image/svg+xml",
    CacheControl: "public, max-age=31536000, immutable",
  })
)
console.log(`✓ uploaded s3://${BUCKET}/${KEY}`)
console.log(`  CDN: https://${CDN}/${KEY}`)
console.log(`  Size: ${(body.length / 1024).toFixed(1)} KB`)
