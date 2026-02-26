// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Seed S3 Videos from Pexels — HD Educational Videos
 *
 * Downloads landscape, HD (720p-1080p), 1-10 minute educational videos
 * for all 62 ClickView K-12 subjects and uploads to S3/CloudFront.
 *
 * Flow:
 *   1. Search Pexels API for educational videos per subject (landscape, HD)
 *   2. Pick up to 5 longest videos per subject (60s-600s, 720p-1080p)
 *   3. Upload to S3 as sample-{slug}-{n}.mp4
 *   4. Cycle videos across ALL LessonVideo records (not just first 2)
 *
 * Prerequisites:
 *   - PEXELS_API_KEY in .env (https://www.pexels.com/api)
 *   - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, CLOUDFRONT_DOMAIN in .env
 *
 * Usage:
 *   pnpm seed:videos              # Full run
 *   pnpm seed:videos --dry-run    # Preview without downloading/uploading
 */

import * as fs from "fs"
import * as http from "http"
import * as https from "https"
import * as path from "path"
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { PrismaClient } from "@prisma/client"

// ============================================================================
// CONFIG
// ============================================================================

const PEXELS_API_KEY = process.env.PEXELS_API_KEY
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET
const AWS_REGION = process.env.AWS_REGION || "us-east-1"
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN

const S3_KEY_PREFIX = "stream/platform/video"
const TMP_DIR = path.join("/tmp", "pexels-videos")

const VIDEOS_PER_SUBJECT = 5
const MIN_DURATION_S = 60
const MAX_DURATION_S = 600
const DOWNLOAD_TIMEOUT_MS = 120_000
const MAX_DOWNLOAD_MB = 25 // Skip videos larger than 25MB to avoid slow uploads
const API_DELAY_MS = 500
const DB_BATCH_SIZE = 50

const DRY_RUN = process.argv.includes("--dry-run")

// ============================================================================
// SUBJECT -> PEXELS SEARCH QUERY MAP (62 ClickView subjects)
// All queries include educational keywords for relevant results
// ============================================================================

const SUBJECT_VIDEO_QUERIES: Record<string, string> = {
  // Elementary (18)
  "elementary-arts": "education art painting classroom instruction",
  "elementary-celebrations-commemorations-and-festivals":
    "education festival celebration cultural event lecture",
  "elementary-civics-and-government":
    "education government building classroom civic instruction",
  "elementary-computer-science-and-technology":
    "education coding programming classroom computer instruction",
  "elementary-earth-and-space-science":
    "education earth planet space classroom lecture",
  "elementary-economics":
    "education business finance classroom economics instruction",
  "elementary-english-language-arts":
    "education reading book library classroom lecture",
  "elementary-geography":
    "education world map landscape classroom geography lecture",
  "elementary-health":
    "education wellness nutrition fitness classroom instruction",
  "elementary-history":
    "education ancient museum history classroom lecture artifacts",
  "elementary-life-science":
    "education nature plants biology classroom instruction",
  "elementary-life-skills":
    "education teamwork life skills classroom instruction",
  "elementary-math": "education math geometry shapes classroom lecture",
  "elementary-physical-education":
    "education sports running athlete physical training",
  "elementary-physical-science":
    "education science laboratory experiment classroom instruction",
  "elementary-religion":
    "education mosque church temple worship classroom instruction",
  "elementary-teacher-professional-development":
    "education teacher classroom professional development training",
  "elementary-world-languages":
    "education communication languages classroom instruction global",

  // Middle (21)
  "middle-arts": "education art sculpture creative classroom instruction",
  "middle-careers-and-technical-education":
    "education career workshop technical training classroom",
  "middle-chemical-science":
    "education chemistry lab experiment classroom instruction",
  "middle-civics-and-government":
    "education government democracy voting classroom lecture",
  "middle-computer-science-and-technology":
    "education technology computer programming classroom instruction",
  "middle-earth-and-space-science":
    "education space stars telescope astronomy classroom lecture",
  "middle-economics": "education economics trade finance classroom instruction",
  "middle-english-language-arts":
    "education writing essay literature classroom lecture",
  "middle-geography":
    "education landscape mountains geography classroom lecture",
  "middle-health": "education health nutrition exercise classroom instruction",
  "middle-life-science":
    "education biology nature wildlife classroom instruction",
  "middle-life-skills":
    "education collaboration problem solving classroom instruction",
  "middle-math": "education algebra equations mathematics classroom lecture",
  "middle-physical-education":
    "education sports gym athletics training instruction",
  "middle-physical-science":
    "education physics motion energy classroom lecture",
  "middle-religion-and-ethics":
    "education mosque islamic architecture ethics classroom",
  "middle-science-and-engineering-practices":
    "education engineering construction design classroom instruction",
  "middle-teacher-professional-development":
    "education teacher training workshop professional development",
  "middle-us-history": "education american monument history classroom lecture",
  "middle-world-history":
    "education ancient civilization history classroom lecture",
  "middle-world-languages":
    "education world language learning classroom instruction",

  // High (23)
  "high-arts": "education fine art modern gallery classroom instruction",
  "high-business-and-economics":
    "education business finance economics classroom lecture",
  "high-career-and-technical-education":
    "education vocational training workshop technical instruction",
  "high-chemistry":
    "education chemistry lab beaker experiment classroom lecture",
  "high-civics-and-government":
    "education parliament law justice government classroom lecture",
  "high-computer-science-and-technology":
    "education coding software development classroom instruction",
  "high-earth-and-space-science":
    "education satellite orbit astronomy space classroom lecture",
  "high-english-language-arts":
    "education literature poetry writing classroom lecture",
  "high-geography": "education geography terrain topography classroom lecture",
  "high-health": "education wellness medical healthcare classroom instruction",
  "high-life-sciences": "education biology cells microscope classroom lecture",
  "high-life-skills":
    "education leadership teamwork communication classroom instruction",
  "high-math": "education calculus graph mathematics classroom lecture",
  "high-physical-education":
    "education athletics competition training physical instruction",
  "high-physics": "education physics light energy motion classroom lecture",
  "high-psychology":
    "education brain thinking mind psychology classroom lecture",
  "high-religion-and-philosophy":
    "education philosophy temple meditation ethics classroom",
  "high-science-and-engineering-practices":
    "education engineering robotics design classroom instruction",
  "high-sociology":
    "education city crowd urban society sociology classroom lecture",
  "high-teacher-professional-development":
    "education seminar professional development teacher training",
  "high-us-history": "education american history civil war classroom lecture",
  "high-world-history":
    "education world history empire ancient classroom lecture",
  "high-world-languages":
    "education multilingual translation culture classroom instruction",
}

// ============================================================================
// PEXELS API TYPES
// ============================================================================

interface PexelsVideoFile {
  id: number
  quality: string
  file_type: string
  width: number
  height: number
  link: string
}

interface PexelsVideo {
  id: number
  duration: number
  video_files: PexelsVideoFile[]
}

interface PexelsSearchResponse {
  videos: PexelsVideo[]
  total_results: number
}

// ============================================================================
// HELPERS
// ============================================================================

function getS3Client(): S3Client {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      "AWS credentials not configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)"
    )
  }
  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  })
}

function getCloudFrontUrl(s3Key: string): string {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`
  }
  return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`
}

async function s3ObjectExists(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: AWS_S3_BUCKET!, Key: key }))
    return true
  } catch {
    return false
  }
}

async function searchPexelsVideos(
  query: string
): Promise<PexelsSearchResponse> {
  const params = new URLSearchParams({
    query,
    per_page: "80",
    orientation: "landscape",
    size: "medium",
    min_duration: String(MIN_DURATION_S),
    max_duration: String(MAX_DURATION_S),
  })
  const url = `https://api.pexels.com/videos/search?${params}`

  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { Authorization: PEXELS_API_KEY! },
        timeout: 15000,
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(
              new Error(
                `Pexels API returned ${res.statusCode}: ${data.slice(0, 200)}`
              )
            )
            return
          }
          resolve(JSON.parse(data))
        })
      }
    )
    req.on("timeout", () => {
      req.destroy()
      reject(new Error("Request timed out (15s)"))
    })
    req.on("error", reject)
  })
}

/**
 * Pick the best HD videos: 60-600s duration, 720p-1080p resolution.
 * Prefers LONGER duration (descending sort) and HIGHER quality MP4.
 * Deduplicates by video ID. Returns up to `count` picks.
 */
function pickBestVideos(
  videos: PexelsVideo[],
  count: number = VIDEOS_PER_SUBJECT
): { video: PexelsVideo; file: PexelsVideoFile }[] {
  if (videos.length === 0) return []

  // Filter to 60s-600s, sort by duration ASCENDING (prefer shorter = smaller files)
  const eligible = videos
    .filter((v) => v.duration >= MIN_DURATION_S && v.duration <= MAX_DURATION_S)
    .sort((a, b) => a.duration - b.duration)

  const pool = eligible.length > 0 ? eligible : videos.slice(0, count)
  const picks: { video: PexelsVideo; file: PexelsVideoFile }[] = []
  const seenIds = new Set<number>()

  for (const video of pool) {
    if (picks.length >= count) break
    if (seenIds.has(video.id)) continue

    // Pick 720p MP4 (smallest HD — fast downloads, ~5-30MB per video)
    const mp4Files = video.video_files
      .filter((f) => f.file_type === "video/mp4")
      .sort((a, b) => {
        // Prefer files in HD range (1280-1920 width)
        const aInRange = a.width >= 1280 && a.width <= 1920 ? 1 : 0
        const bInRange = b.width >= 1280 && b.width <= 1920 ? 1 : 0
        if (aInRange !== bInRange) return bInRange - aInRange
        // Within range, prefer LOWER resolution (720p over 1080p — smaller files)
        return a.width - b.width
      })

    if (mp4Files.length > 0) {
      picks.push({ video, file: mp4Files[0] })
      seenIds.add(video.id)
    }
  }

  return picks
}

/**
 * Download file from URL, following redirects. Uses 120s timeout.
 * Rejects with "TOO_LARGE" if Content-Length exceeds MAX_DOWNLOAD_MB.
 */
function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    const protocol = url.startsWith("https") ? https : http

    const req = protocol
      .get(url, { timeout: DOWNLOAD_TIMEOUT_MS }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close()
          fs.unlinkSync(filepath)
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            downloadFile(redirectUrl, filepath).then(resolve).catch(reject)
          } else {
            reject(new Error("Redirect without location header"))
          }
          return
        }

        if (response.statusCode !== 200) {
          file.close()
          fs.unlinkSync(filepath)
          reject(new Error(`HTTP ${response.statusCode}`))
          return
        }

        // Check Content-Length before downloading
        const contentLength = parseInt(
          response.headers["content-length"] || "0",
          10
        )
        const maxBytes = MAX_DOWNLOAD_MB * 1024 * 1024
        if (contentLength > maxBytes) {
          file.close()
          response.destroy()
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
          reject(
            new Error(
              `TOO_LARGE: ${(contentLength / 1024 / 1024).toFixed(1)}MB > ${MAX_DOWNLOAD_MB}MB limit`
            )
          )
          return
        }

        response.pipe(file)
        file.on("finish", () => {
          file.close()
          resolve()
        })
      })
      .on("error", (err) => {
        file.close()
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
        reject(err)
      })
    req.on("timeout", () => {
      req.destroy()
      file.close()
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
      reject(new Error(`Download timed out (${DOWNLOAD_TIMEOUT_MS / 1000}s)`))
    })
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Keep Neon DB awake during long-running operations.
 * Runs a simple SELECT 1 every 60s to prevent auto-suspend.
 */
function startDbKeepAlive(prisma: PrismaClient): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      // Ignore errors — reconnect will happen on next real query
    }
  }, 60_000)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🎬 Seed S3 Videos from Pexels — HD Educational Videos")
  console.log("=======================================================")
  console.log(`   Videos per subject: ${VIDEOS_PER_SUBJECT}`)
  console.log(`   Duration range: ${MIN_DURATION_S}s - ${MAX_DURATION_S}s`)
  console.log(`   Resolution: 720p-1080p (landscape)`)
  console.log(`   Download timeout: ${DOWNLOAD_TIMEOUT_MS / 1000}s`)
  console.log(`   API delay: ${API_DELAY_MS}ms`)
  if (DRY_RUN) console.log(`   MODE: DRY RUN (no downloads or uploads)`)
  console.log()

  // --- Validate env ---
  if (!PEXELS_API_KEY) {
    console.error("❌ PEXELS_API_KEY not found in environment.\n")
    console.error("To get a free API key:")
    console.error("  1. Go to https://www.pexels.com/api → click 'Get Started'")
    console.error("  2. Sign up / log in → create a project → copy the API key")
    console.error("  3. Add PEXELS_API_KEY=your_key_here to .env\n")
    process.exit(1)
  }

  if (
    !DRY_RUN &&
    (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET)
  ) {
    console.error(
      "❌ AWS credentials missing. Need AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET in .env"
    )
    process.exit(1)
  }

  // --- Setup ---
  const s3 = DRY_RUN ? null : getS3Client()
  const prisma = new PrismaClient()
  const keepAlive = startDbKeepAlive(prisma)

  if (!DRY_RUN && !fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true })
  }

  try {
    // 1. Fetch all catalog subjects
    const subjects = await prisma.catalogSubject.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, name: true },
    })

    if (subjects.length === 0) {
      console.log(
        "No published catalog subjects found. Run catalog seed first."
      )
      return
    }

    const totalSubjects = subjects.length
    const queryableSubjects = subjects.filter(
      (s) => SUBJECT_VIDEO_QUERIES[s.slug]
    ).length

    console.log(`Found ${totalSubjects} published subjects`)
    console.log(`${queryableSubjects} have video search queries\n`)

    // 2. Download & upload up to 5 videos per subject
    const subjectVideoMap: Record<
      string,
      { cloudFrontUrl: string; s3Key: string; duration: number }[]
    > = {}

    let downloaded = 0
    let skipped = 0
    let failed = 0
    let processed = 0

    for (const subject of subjects) {
      const query = SUBJECT_VIDEO_QUERIES[subject.slug]
      if (!query) {
        skipped++
        continue
      }

      processed++
      console.log(
        `\n[${processed}/${queryableSubjects}] 📹 ${subject.name} (${subject.slug})`
      )
      console.log(`   Query: "${query}"`)

      try {
        const searchResult = await searchPexelsVideos(query)

        if (searchResult.videos.length === 0) {
          console.log(`   ⚠️  No Pexels results, skipping`)
          failed++
          await delay(API_DELAY_MS)
          continue
        }

        console.log(
          `   Found ${searchResult.videos.length} videos (${searchResult.total_results} total)`
        )

        const picks = pickBestVideos(searchResult.videos)
        if (picks.length === 0) {
          console.log(`   ⚠️  No suitable HD MP4 found, skipping`)
          failed++
          await delay(API_DELAY_MS)
          continue
        }

        if (DRY_RUN) {
          console.log(`   🔍 Would download ${picks.length} videos:`)
          for (let i = 0; i < picks.length; i++) {
            const pick = picks[i]
            console.log(
              `      [${i + 1}] ${pick.video.duration}s, ${pick.file.width}x${pick.file.height}`
            )
          }
          subjectVideoMap[subject.slug] = picks.map((p, i) => ({
            cloudFrontUrl: `https://cdn.example.com/sample-${subject.slug}-${i + 1}.mp4`,
            s3Key: `${S3_KEY_PREFIX}/sample-${subject.slug}-${i + 1}.mp4`,
            duration: p.video.duration,
          }))
          downloaded++
          await delay(API_DELAY_MS)
          continue
        }

        const entries: {
          cloudFrontUrl: string
          s3Key: string
          duration: number
        }[] = []

        for (let i = 0; i < picks.length; i++) {
          const pick = picks[i]
          const suffix = i + 1
          const s3Key = `${S3_KEY_PREFIX}/sample-${subject.slug}-${suffix}.mp4`
          const tmpFile = path.join(
            TMP_DIR,
            `pexels-${subject.slug}-${suffix}.mp4`
          )

          console.log(
            `   [${suffix}/${picks.length}] Duration: ${pick.video.duration}s, Resolution: ${pick.file.width}x${pick.file.height}`
          )

          // Download (skip if already cached in /tmp)
          if (fs.existsSync(tmpFile)) {
            // Check cached file isn't oversized (from previous 1080p runs)
            const cachedSize = fs.statSync(tmpFile).size
            if (cachedSize > MAX_DOWNLOAD_MB * 1024 * 1024) {
              console.log(
                `   ⏭️  Cached file too large (${(cachedSize / 1024 / 1024).toFixed(1)}MB), re-downloading...`
              )
              fs.unlinkSync(tmpFile)
            } else if (cachedSize === 0) {
              console.log(`   ⏭️  Cached file empty, re-downloading...`)
              fs.unlinkSync(tmpFile)
            } else {
              console.log(`   ⏭️  Using cached download`)
            }
          }

          if (!fs.existsSync(tmpFile)) {
            console.log(`   ⬇️  Downloading...`)
            try {
              await downloadFile(pick.file.link, tmpFile)
            } catch (dlErr) {
              const msg = dlErr instanceof Error ? dlErr.message : String(dlErr)
              if (msg.includes("TOO_LARGE")) {
                console.log(`   ⏭️  ${msg}, skipping`)
                continue
              }
              console.log(`   ⚠️  Download failed, retrying...`)
              await delay(1000)
              try {
                await downloadFile(pick.file.link, tmpFile)
              } catch (retryErr) {
                const retryMsg =
                  retryErr instanceof Error
                    ? retryErr.message
                    : String(retryErr)
                if (retryMsg.includes("TOO_LARGE")) {
                  console.log(`   ⏭️  ${retryMsg}, skipping`)
                } else {
                  console.log(
                    `   ❌ Download failed after retry, skipping video ${suffix}`
                  )
                }
                continue
              }
            }
          }

          // Upload to S3 (skip if already exists)
          const cloudFrontUrl = getCloudFrontUrl(s3Key)
          if (await s3ObjectExists(s3!, s3Key)) {
            console.log(`   ☁️  Already in S3, skipping upload`)
            entries.push({
              cloudFrontUrl,
              s3Key,
              duration: pick.video.duration,
            })
          } else {
            const fileBuffer = fs.readFileSync(tmpFile)
            console.log(
              `   ⬆️  Uploading to S3 (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)...`
            )

            await s3!.send(
              new PutObjectCommand({
                Bucket: AWS_S3_BUCKET,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: "video/mp4",
                CacheControl: "public, max-age=31536000, immutable",
              })
            )

            entries.push({
              cloudFrontUrl,
              s3Key,
              duration: pick.video.duration,
            })
            console.log(`   ✅ Uploaded → ${cloudFrontUrl}`)
          }
        }

        if (entries.length > 0) {
          subjectVideoMap[subject.slug] = entries
          downloaded++
        } else {
          failed++
        }
      } catch (error) {
        console.log(
          `   ❌ Error: ${error instanceof Error ? error.message : error}`
        )
        failed++
      }

      await delay(API_DELAY_MS)
    }

    console.log("\n=======================================================")
    console.log(`📊 Download Summary:`)
    console.log(`   Downloaded: ${downloaded}/${queryableSubjects}`)
    console.log(`   Skipped (no query): ${skipped}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Total subjects: ${totalSubjects}`)

    if (downloaded === 0) {
      console.log("\n⚠️  No videos downloaded. Skipping DB updates.")
      return
    }

    // 3. Create LessonVideo records for all catalog lessons
    console.log("\n📝 Creating LessonVideo records...")
    if (DRY_RUN) console.log("   (DRY RUN — no DB changes)")

    // Resolve dev user for video attribution
    const devUser = await prisma.user.findFirst({
      where: { email: "dev@databayt.org" },
      select: { id: true },
    })
    if (!devUser) {
      console.log("   ⚠️  dev@databayt.org not found. Skipping DB records.")
      return
    }

    // Get all catalog lessons grouped by subject slug
    const allLessons = await prisma.catalogLesson.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        name: true,
        sequenceOrder: true,
        chapter: {
          select: {
            sequenceOrder: true,
            subject: {
              select: { slug: true },
            },
          },
        },
      },
      orderBy: [
        { chapter: { subject: { sortOrder: "asc" } } },
        { chapter: { sequenceOrder: "asc" } },
        { sequenceOrder: "asc" },
      ],
    })

    console.log(`   Found ${allLessons.length} published catalog lessons`)

    // Group by subject slug
    const lessonsBySlug: Record<
      string,
      { id: string; name: string; chapterOrder: number; lessonOrder: number }[]
    > = {}
    for (const lesson of allLessons) {
      const slug = lesson.chapter.subject.slug
      if (!lessonsBySlug[slug]) lessonsBySlug[slug] = []
      lessonsBySlug[slug].push({
        id: lesson.id,
        name: lesson.name,
        chapterOrder: lesson.chapter.sequenceOrder,
        lessonOrder: lesson.sequenceOrder,
      })
    }

    let created = 0
    let noMapping = 0

    // Delete existing self-hosted platform videos to avoid duplicates
    if (!DRY_RUN) {
      const deleted = await prisma.lessonVideo.deleteMany({
        where: { provider: "self-hosted", schoolId: null },
      })
      if (deleted.count > 0) {
        console.log(
          `   Cleaned up ${deleted.count} existing self-hosted videos`
        )
      }
    }

    // Create LessonVideo for each lesson, cycling through subject's videos
    for (const [slug, lessons] of Object.entries(lessonsBySlug)) {
      const entries = subjectVideoMap[slug]
      if (!entries || entries.length === 0) {
        noMapping += lessons.length
        continue
      }

      // Batch creates in chunks
      for (let i = 0; i < lessons.length; i += DB_BATCH_SIZE) {
        const batch = lessons.slice(i, i + DB_BATCH_SIZE)

        if (!DRY_RUN) {
          await prisma.lessonVideo.createMany({
            data: batch.map((lesson, batchIdx) => {
              const globalIdx = i + batchIdx
              const entry = entries[globalIdx % entries.length]
              return {
                catalogLessonId: lesson.id,
                userId: devUser.id,
                title: `${lesson.name} - Video`,
                description: `HD educational video for ${lesson.name}`,
                lang: "en",
                videoUrl: entry.cloudFrontUrl,
                durationSeconds: entry.duration,
                provider: "self-hosted",
                storageProvider: "aws_s3",
                storageKey: entry.s3Key,
                visibility: "PUBLIC",
                approvalStatus: "APPROVED",
                isFeatured: globalIdx === 0,
              }
            }),
            skipDuplicates: true,
          })
        }

        created += batch.length
      }

      console.log(
        `   ${slug}: ${lessons.length} lessons seeded (${entries.length} videos cycled)`
      )
    }

    console.log(
      `\n✅ Done! Created ${created} lesson videos across all subjects, ${noMapping} had no video mapping`
    )
  } finally {
    clearInterval(keepAlive)
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
