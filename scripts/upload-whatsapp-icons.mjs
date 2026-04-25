import { readdir, readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const LOCAL_DIR = join(__dirname, "..", "public", "icons", "whatsapp")
const S3_PREFIX = "icons/"

const REGION = process.env.AWS_REGION || "us-east-1"
const BUCKET = process.env.AWS_S3_BUCKET || "hogwarts-databayt"
const CDN_DOMAIN =
  process.env.NEXT_PUBLIC_CDN_DOMAIN || process.env.CLOUDFRONT_DOMAIN
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID

async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error(
      "AWS credentials missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (or source .env)."
    )
    process.exit(1)
  }

  const s3 = new S3Client({ region: REGION })
  const files = (await readdir(LOCAL_DIR)).filter(
    (f) => f.startsWith("ic-wa-") && f.endsWith(".svg")
  )

  console.log(
    `Uploading ${files.length} SVG icons → s3://${BUCKET}/${S3_PREFIX}\n`
  )

  const manifest = []
  let ok = 0,
    fail = 0

  for (const f of files) {
    const body = await readFile(join(LOCAL_DIR, f))
    const key = `${S3_PREFIX}${f}`
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: body,
          ContentType: "image/svg+xml",
          CacheControl: "public, max-age=31536000, immutable",
        })
      )
      const cdnUrl = CDN_DOMAIN
        ? `https://${CDN_DOMAIN}/${key}`
        : `s3://${BUCKET}/${key}`
      console.log(`  ✓ ${key}`)
      manifest.push({
        name: f.replace(/\.svg$/, ""),
        key,
        url: cdnUrl,
        bytes: body.length,
      })
      ok++
    } catch (e) {
      console.log(`  ✗ ${key}  ${e.message}`)
      fail++
    }
  }

  await writeFile(
    join(LOCAL_DIR, "cdn-manifest.json"),
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        bucket: BUCKET,
        cdn: CDN_DOMAIN,
        count: ok,
        icons: manifest,
      },
      null,
      2
    )
  )

  console.log(`\n${ok} ok / ${fail} failed`)

  if (CLOUDFRONT_DISTRIBUTION_ID && ok > 0) {
    console.log(`\nInvalidating CloudFront paths...`)
    const cf = new CloudFrontClient({ region: REGION })
    const paths = manifest.map((m) => `/${m.key}`)
    const res = await cf.send(
      new CreateInvalidationCommand({
        DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: `wa-icons-${Date.now()}`,
          Paths: { Quantity: paths.length, Items: paths },
        },
      })
    )
    console.log(
      `  Invalidation ID: ${res.Invalidation?.Id}  Status: ${res.Invalidation?.Status}`
    )
  }

  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
