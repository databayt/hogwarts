/**
 * Upload Grade 1 Sudan curriculum textbook PDFs and SVG covers to S3
 * Usage: npx tsx scripts/upload-textbooks-g1.ts
 */

import { readFileSync } from "fs"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { config } from "dotenv"

config() // Load .env

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET!

const SUBJECTS = [
  {
    id: "cmn871rm90000sd8drlfntgv7",
    name: "Arabic",
    pdf: "/Users/abdout/SD/G1/1rb.pdf",
    cover: "/Users/abdout/SD/G1/arabic.svg",
  },
  {
    id: "cmn8722gf0035sd8d8gp9yjuo",
    name: "Math",
    pdf: "/Users/abdout/SD/G1/1mth.pdf",
    cover: "/Users/abdout/SD/G1/math.svg",
  },
  {
    id: "cmn872dgc0062sd8dgnahi8c8",
    name: "Islamic Studies",
    pdf: "/Users/abdout/SD/G1/1slm.pdf",
    cover: "/Users/abdout/SD/G1/islamic.svg",
  },
  {
    id: "cmn872eob006fsd8dcthy3bjz",
    name: "English",
    pdf: "/Users/abdout/SD/G1/english1.pdf",
    cover: "/Users/abdout/SD/G1/english.svg",
  },
]

async function upload(key: string, filePath: string, contentType: string) {
  const body = readFileSync(filePath)
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )
  console.log(
    `  Uploaded: ${key} (${(body.length / 1024 / 1024).toFixed(1)} MB)`
  )
}

async function main() {
  console.log(`Uploading to S3 bucket: ${BUCKET}\n`)

  for (const subject of SUBJECTS) {
    console.log(`${subject.name} (${subject.id})`)

    const pdfKey = `catalog/subjects/${subject.id}/textbook.pdf`
    const coverKey = `catalog/subjects/${subject.id}/cover.svg`

    await upload(pdfKey, subject.pdf, "application/pdf")
    await upload(coverKey, subject.cover, "image/svg+xml")
  }

  console.log("\nAll uploads complete!")
  console.log("\nRun the following SQL to update the database:\n")

  for (const subject of SUBJECTS) {
    const pdfKey = `catalog/subjects/${subject.id}/textbook.pdf`
    const coverKey = `catalog/subjects/${subject.id}/cover.svg`
    console.log(
      `UPDATE catalog_subjects SET pdf = '${pdfKey}', cover = '${coverKey}' WHERE id = '${subject.id}';`
    )
  }
}

main().catch(console.error)
