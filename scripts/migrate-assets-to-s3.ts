#!/usr/bin/env tsx
/**
 * CDN Asset Migration Script
 *
 * Uploads code-referenced assets from public/ to S3 with new flat directory structure.
 * Idempotent: skips files already uploaded (HeadObject check).
 *
 * Usage:
 *   pnpm tsx scripts/migrate-assets-to-s3.ts          # dry run (default)
 *   pnpm tsx scripts/migrate-assets-to-s3.ts --upload  # actually upload
 *   pnpm tsx scripts/migrate-assets-to-s3.ts --manifest # output JSON manifest
 */
import "dotenv/config"

import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

// ---------------------------------------------------------------------------
// MIME type detection (inline to avoid adding a dependency)
// ---------------------------------------------------------------------------

const MIME_MAP: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
  ".pdf": "application/pdf",
}

function getMimeType(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase()
  return MIME_MAP[ext] || "application/octet-stream"
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BUCKET = process.env.AWS_S3_BUCKET || "hogwarts-databayt"
const REGION = process.env.AWS_REGION || "us-east-1"
const PUBLIC_DIR = join(process.cwd(), "public")
const CACHE_CONTROL = "public, max-age=31536000, immutable"

// ---------------------------------------------------------------------------
// Path mapping: old public/ path → new S3 key
//
// Categories:
//   icons/          Small, simple, functional (SVGs, logos, small PNGs)
//   illustrations/  Art, decorative, complex
//   photos/         Real photographs
//   animations/     Lottie JSON
//   media/          Video/audio
// ---------------------------------------------------------------------------

const PATH_MAP: Record<string, string> = {
  // ── Brand ──────────────────────────────────────────────────────────────
  "logo.png": "icons/logo.png",
  "master-card.png": "icons/master-card.png",

  // ── Chatbot ────────────────────────────────────────────────────────────
  "robot.png": "illustrations/robot.png",

  // ── HP site art ────────────────────────────────────────────────────────
  "ball.png": "illustrations/ball.png",

  // ── Form attachment icons ──────────────────────────────────────────────
  "degree.png": "icons/degree.png",
  "transcript.png": "icons/transcript.png",
  "id.png": "icons/id.png",
  "resume.png": "icons/resume.png",
  "files.png": "icons/files.png",
  "image.png": "icons/image.png",

  // ── Exam type icons ────────────────────────────────────────────────────
  "multiple-choice.svg": "icons/multiple-choice.svg",
  "true-false.svg": "icons/true-false.svg",
  "short-answer.svg": "icons/short-answer.svg",
  "essay.svg": "icons/essay.svg",
  "fill-in-blank.svg": "icons/fill-in-blank.svg",
  "matching.svg": "icons/matching.svg",
  "ordering.svg": "icons/ordering.svg",
  "multi-select.svg": "icons/multi-select.svg",

  // ── AI fluency hero ────────────────────────────────────────────────────
  "ai-fluency-hero.webp": "illustrations/ai-fluency-hero.webp",

  // ── Media ──────────────────────────────────────────────────────────────
  "story.mp4": "media/story.mp4",

  // ── Anthropic: functional icons ────────────────────────────────────────
  "anthropic/graduation-cap.svg": "icons/graduation-cap.svg",
  "anthropic/star-outline.svg": "icons/star-outline.svg",
  "anthropic/book-open.svg": "icons/book-open.svg",
  "anthropic/user.svg": "icons/anthropic-user.svg", // collision with potential "user.svg"
  "anthropic/users.svg": "icons/users.svg",
  "anthropic/check-circle.svg": "icons/check-circle.svg",
  "anthropic/document.svg": "icons/document.svg",
  "anthropic/news.svg": "icons/news.svg",

  // ── Anthropic: decorative illustrations ────────────────────────────────
  "anthropic/Hands-Build.svg": "illustrations/hands-build.svg",
  "anthropic/Hands-Stack.svg": "illustrations/hands-stack.svg",
  "anthropic/Objects-Puzzle.svg": "illustrations/objects-puzzle.svg",
  "anthropic/category-01.svg": "illustrations/category-01.svg",
  "anthropic/category-02.svg": "illustrations/category-02.svg",
  "anthropic/category-03.svg": "illustrations/category-03.svg",
  "anthropic/category-04.svg": "illustrations/category-04.svg",
  "anthropic/category-05.svg": "illustrations/category-05.svg",
  "anthropic/category-06.svg": "illustrations/category-06.svg",
  "anthropic/category-07.svg": "illustrations/category-07.svg",
  "anthropic/category-08.svg": "illustrations/category-08.svg",
  "anthropic/category-09.svg": "illustrations/category-09.svg",
  "anthropic/category-10.svg": "illustrations/category-10.svg",
  "anthropic/category-11.svg": "illustrations/category-11.svg",
  "anthropic/category-12.svg": "illustrations/category-12.svg",
  "anthropic/category-13.svg": "illustrations/category-13.svg",
  "anthropic/category-14.svg": "illustrations/category-14.svg",
  "anthropic/claude-code-best-practices.svg":
    "illustrations/claude-code-best-practices.svg",
  "anthropic/think-tool.svg": "illustrations/think-tool.svg",
  "anthropic/eng-long-running-agents.svg":
    "illustrations/eng-long-running-agents.svg",
  "anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg":
    "illustrations/anthropic-abstract.svg",

  // ── Payment icons ──────────────────────────────────────────────────────
  "payment/visa.svg": "icons/visa.svg",
  "payment/mastercard.svg": "icons/mastercard.svg",
  "payment/amex.svg": "icons/amex.svg",
  "payment/apple-pay.svg": "icons/apple-pay.svg",
  "payment/google-pay.svg": "icons/google-pay.svg",
  "payment/paypal.svg": "icons/paypal.svg",
  "payment/mada.svg": "icons/mada.svg",
  "payment/stcpay.svg": "icons/stcpay.svg",
  "payment/fawry.svg": "icons/fawry.svg",

  // ── Feature illustrations ──────────────────────────────────────────────
  "feature/student.png": "illustrations/student.png",
  "feature/teacher.png": "illustrations/teacher.png",
  "feature/fees.png": "illustrations/fees.png",
  "feature/exam.png": "illustrations/exam.png",
  "feature/assigment.png": "illustrations/assigment.png",
  "feature/attendance.png": "illustrations/attendance.png",
  "feature/gradebook.png": "illustrations/gradebook.png",
  "feature/timetable.png": "illustrations/timetable.png",
  "feature/library.png": "illustrations/library.png",
  "feature/events.png": "illustrations/events.png",
  "feature/video.png": "illustrations/video.png",
  "feature/payroll.png": "illustrations/payroll.png",
  "feature/invoicing.png": "illustrations/invoicing.png",
  "feature/wallet-3.png": "illustrations/wallet-3.png",
  "feature/credit-card.png": "illustrations/credit-card.png",
  "feature/app-store.png": "illustrations/app-store.png",
  "feature/email.png": "illustrations/email.png",
  "feature/offer.png": "illustrations/offer.png",
  "feature/canteen.png": "illustrations/canteen.png",
  "feature/parent.png": "illustrations/parent.png",
  "feature/transport.png": "illustrations/transport.png",
  "feature/headphone.png": "illustrations/headphone.png",
  "feature/notifications.png": "illustrations/notifications.png",
  "feature/calendar-2.png": "illustrations/calendar-2.png",
  "feature/id-cards.png": "illustrations/id-cards.png",
  "feature/phone.png": "illustrations/phone.png",
  "feature/messaging.png": "illustrations/messaging.png",
  "feature/graduate.png": "illustrations/graduate.png",
  "feature/blackboard.png": "illustrations/blackboard.png",
  "feature/download.png": "illustrations/download.png",
  "feature/role-based.png": "illustrations/role-based.png",
  "feature/cover-letter.png": "illustrations/cover-letter.png",
  "features/admission.png": "illustrations/admission.png",

  // ── Site art ───────────────────────────────────────────────────────────
  "site/ball.png": "illustrations/site-ball.png", // collision with root ball.png
  "site/hat.png": "illustrations/hat.png",
  "site/glass.png": "illustrations/glass.png",
  "site/tent.png": "illustrations/tent.png",
  "site/teleport.png": "illustrations/teleport.png",
  "site/community.png": "illustrations/community.png",
  "site/champion.png": "illustrations/champion.png",
  "site/world.png": "illustrations/world.png",
  "site/light-bulb.png": "illustrations/light-bulb.png",
  "site/z.png": "icons/z.png",

  // ── Site photos ────────────────────────────────────────────────────────
  "site/harry-potter.png": "photos/harry-potter.png",
  "site/h.jpeg": "photos/site-h.jpeg", // collision with contributors/h.jpeg
  "site/trian.jpeg": "photos/trian.jpeg",
  "site/a.jpeg": "photos/site-a.jpeg",
  "site/b.jpeg": "photos/site-b.jpeg",
  "site/map.jpeg": "photos/map.jpeg",
  "site/dumbledore.jpeg": "photos/dumbledore.jpeg",
  "site/snape.jpeg": "photos/snape.jpeg",
  "site/mcgonagall.jpeg": "photos/mcgonagall.jpeg",
  "site/hagrid.jpeg": "photos/hagrid.jpeg",
  "site/gryffindor.jpeg": "photos/gryffindor.jpeg",
  "site/ravenclaw.jpeg": "photos/ravenclaw.jpeg",
  "site/hupplepuff.jpeg": "photos/hupplepuff.jpeg",
  "site/slytherin.jpg": "photos/slytherin.jpg",

  // ── Stream ─────────────────────────────────────────────────────────────
  "stream/teach.jpg": "illustrations/teach.jpg",
  "stream/inspire.jpg": "illustrations/inspire.jpg",
  "stream/reward.jpg": "illustrations/reward.jpg",
  "stream/skills/generative-ai.png": "illustrations/generative-ai.png",
  "stream/skills/it-certifications.png": "illustrations/it-certifications.png",
  "stream/skills/data-science.png": "illustrations/data-science.png",

  // ── Onboarding ─────────────────────────────────────────────────────────
  "onboarding/private.png": "illustrations/private.png",
  "onboarding/public.png": "illustrations/onboarding-public.png", // "public" is ambiguous
  "onboarding/international.png": "illustrations/international.png",
  "onboarding/techincal.png": "illustrations/techincal.png",
  "onboarding/espical.png": "illustrations/espical.png",

  // ── Animations (Lottie JSON) ───────────────────────────────────────────
  "animations/confetti.json": "animations/confetti.json",
  "animations/anthropic-hero.json": "animations/anthropic-hero.json",
  "stream/education-animation.json": "animations/education.json",

  // ── Contributors (photos) ──────────────────────────────────────────────
  "contributors/h.jpeg": "photos/contributors-h.jpeg", // collision with site/h.jpeg
  "contributors/d.jpeg": "photos/contributors-d.jpeg",
  "contributors/1.jpg": "photos/contributor-1.jpg",
  "contributors/2.jpg": "photos/contributor-2.jpg",
  "contributors/3.jpg": "photos/contributor-3.jpg",
  "contributors/mazin.jpg": "photos/mazin.jpg",
  "contributors/5.jpg": "photos/contributor-5.jpg",
  "contributors/6.jpg": "photos/contributor-6.jpg",

  // ── GitHub achievement badges ──────────────────────────────────────────
  "github/starstruck-detail.png": "illustrations/starstruck-detail.png",
  "github/galaxy-brain-detail.png": "illustrations/galaxy-brain-detail.png",
  "github/pull-shark-detail.png": "illustrations/pull-shark-detail.png",
  "github/yolo-detail.png": "illustrations/yolo-detail.png",
  "github/pair-extraordinaire-detail.png":
    "illustrations/pair-extraordinaire-detail.png",
  "github/quickdraw-detail.png": "illustrations/quickdraw-detail.png",
  "github/public-sponsor-detail.png": "illustrations/public-sponsor-detail.png",

  // ── Public icons (mission SVGs + profile PNGs) ─────────────────────────
  "icons/hands-build.svg": "icons/hands-build.svg",
  "icons/hands-stack.svg": "icons/hands-stack.svg",
  "icons/objects-puzzle.svg": "icons/objects-puzzle.svg",
  "icons/council.png": "icons/council.png",
  "icons/science.png": "icons/science.png",
  "icons/chess.png": "icons/chess.png",
  "icons/math.png": "icons/math.png",
  "icons/curriculum.png": "icons/curriculum.png",
  "icons/parents.png": "icons/parents.png",
  "icons/admin.png": "icons/admin.png",

  // ── Sponsor logos ──────────────────────────────────────────────────────
  "sponser/faisal.png": "icons/faisal.png",
  "sponser/mtdt.png": "icons/mtdt.png",
  "sponser/zain.png": "icons/zain.png",
  "sponser/khartoum.png": "icons/khartoum.png",
  "sponser/dal.png": "icons/dal.png",
  "sponser/249.png": "icons/249.png",
  "sponser/uok.png": "icons/uok.png",

  // ── Onboarding illustration ────────────────────────────────────────────
  "illustrations/onboarding-step2.svg": "illustrations/onboarding-step2.svg",
}

// ---------------------------------------------------------------------------
// S3 Client
// ---------------------------------------------------------------------------

function createS3(): S3Client {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in .env"
    )
  }
  return new S3Client({
    region: REGION,
    credentials: { accessKeyId, secretAccessKey },
  })
}

// ---------------------------------------------------------------------------
// Upload logic
// ---------------------------------------------------------------------------

async function fileExistsInS3(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function uploadFile(
  s3: S3Client,
  localPath: string,
  s3Key: string
): Promise<{ skipped: boolean }> {
  const exists = await fileExistsInS3(s3, s3Key)
  if (exists) return { skipped: true }

  const body = readFileSync(localPath)
  const contentType = getMimeType(localPath)

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: body,
      ContentType: contentType,
      CacheControl: CACHE_CONTROL,
    })
  )

  return { skipped: false }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const doUpload = args.includes("--upload")
  const doManifest = args.includes("--manifest")

  const entries = Object.entries(PATH_MAP)
  const manifest: Record<string, string> = {}
  const cdnDomain =
    process.env.NEXT_PUBLIC_CDN_DOMAIN || "d1dlwtcfl0db67.cloudfront.net"

  console.log(`\n  CDN Asset Migration`)
  console.log(`  ═══════════════════`)
  console.log(`  Bucket:  ${BUCKET}`)
  console.log(`  Region:  ${REGION}`)
  console.log(`  CDN:     https://${cdnDomain}`)
  console.log(`  Mode:    ${doUpload ? "UPLOAD" : "DRY RUN"}`)
  console.log(`  Assets:  ${entries.length} files\n`)

  let uploaded = 0
  let skipped = 0
  let missing = 0
  let errors = 0

  const s3 = doUpload ? createS3() : null

  for (const [oldPath, s3Key] of entries) {
    const localFile = join(PUBLIC_DIR, oldPath)
    const cdnUrl = `https://${cdnDomain}/${s3Key}`

    if (!existsSync(localFile)) {
      console.log(`  MISSING  ${oldPath}`)
      missing++
      continue
    }

    manifest[`/${oldPath}`] = cdnUrl

    if (!doUpload) {
      console.log(`  ✓  /${oldPath}  →  ${s3Key}`)
      continue
    }

    try {
      const { skipped: wasSkipped } = await uploadFile(s3!, localFile, s3Key)
      if (wasSkipped) {
        console.log(`  SKIP     ${s3Key}  (already exists)`)
        skipped++
      } else {
        console.log(`  UPLOAD   ${s3Key}`)
        uploaded++
      }
    } catch (err) {
      console.error(`  ERROR    ${s3Key}:`, (err as Error).message)
      errors++
    }
  }

  console.log(`\n  ─────────────────────`)
  if (doUpload) {
    console.log(`  Uploaded: ${uploaded}`)
    console.log(`  Skipped:  ${skipped}`)
  } else {
    console.log(`  Would upload: ${entries.length - missing}`)
  }
  console.log(`  Missing:  ${missing}`)
  if (errors) console.log(`  Errors:   ${errors}`)
  console.log()

  if (doManifest) {
    const manifestPath = join(process.cwd(), "scripts/asset-manifest.json")
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    console.log(`  Manifest written to ${manifestPath}\n`)
  }
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
