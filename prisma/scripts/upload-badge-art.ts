// One-off: upload public/github/*.png badge art to the CDN origin bucket
// under hogwarts/<basename> (matches asset() flattening).
import fs from "fs"
import path from "path"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const DIR = "/Users/abdout/hogwarts/public/github"
const BUCKET = process.env.CDN_S3_BUCKET || "databayt-cdn"

async function main() {
  const client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png"))
  for (const f of files) {
    const body = fs.readFileSync(path.join(DIR, f))
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `hogwarts/${f}`,
        Body: body,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000, immutable",
      })
    )
    console.log(`ok hogwarts/${f} (${body.length}b)`)
  }
  console.log(`${files.length} files uploaded to ${BUCKET}`)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
