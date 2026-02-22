/**
 * Seed S3 Videos from Pexels
 *
 * Replaces placeholder YouTube URLs in platform-level LessonVideo records
 * with real short videos hosted on S3/CloudFront.
 *
 * Flow:
 *   1. Search Pexels API for videos by subject keywords (up to 20 min)
 *   2. Download 2 shortest MP4s per ClickView subject (~124 videos)
 *   3. Upload to S3 as sample-{slug}-1.mp4 and sample-{slug}-2.mp4
 *   4. Update first 2 LessonVideo records per subject (provider=youtube, schoolId=null)
 *
 * Prerequisites:
 *   - PEXELS_API_KEY in .env (https://www.pexels.com/api → Get Started)
 *   - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, CLOUDFRONT_DOMAIN in .env
 *
 * Usage: pnpm seed:videos
 */

import * as fs from "fs"
import * as http from "http"
import * as https from "https"
import * as path from "path"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
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

/** Delay between Pexels API calls (ms) — generous for 200 req/hr free tier */
const API_DELAY_MS = 200

// ============================================================================
// SUBJECT → PEXELS SEARCH QUERY MAP (62 ClickView subjects)
// ============================================================================

const SUBJECT_VIDEO_QUERIES: Record<string, string> = {
  // Elementary (18)
  "elementary-arts": "painting art gallery",
  "elementary-celebrations-commemorations-and-festivals":
    "festival celebration fireworks",
  "elementary-civics-and-government": "government building capitol",
  "elementary-computer-science-and-technology": "coding programming computer",
  "elementary-earth-and-space-science": "earth planet space",
  "elementary-economics": "business finance stock market",
  "elementary-english-language-arts": "reading book library",
  "elementary-geography": "world map landscape",
  "elementary-health": "wellness nutrition fitness",
  "elementary-history": "ancient museum artifacts",
  "elementary-life-science": "nature plants cells",
  "elementary-life-skills": "teamwork cooking life skills",
  "elementary-math": "math geometry shapes",
  "elementary-physical-education": "sports running athlete",
  "elementary-physical-science": "science laboratory experiment",
  "elementary-religion": "mosque church temple worship",
  "elementary-teacher-professional-development": "teacher classroom education",
  "elementary-world-languages": "communication globe languages",

  // Middle (21)
  "middle-arts": "art sculpture creative",
  "middle-careers-and-technical-education": "career workshop office",
  "middle-chemical-science": "chemistry lab test tubes",
  "middle-civics-and-government": "government democracy voting",
  "middle-computer-science-and-technology": "technology keyboard computer",
  "middle-earth-and-space-science": "space stars telescope",
  "middle-economics": "economics trade money",
  "middle-english-language-arts": "writing essay literature",
  "middle-geography": "landscape mountains rivers",
  "middle-health": "health nutrition exercise",
  "middle-life-science": "biology nature wildlife",
  "middle-life-skills": "collaboration problem solving",
  "middle-math": "algebra equations numbers",
  "middle-physical-education": "sports gym athletics",
  "middle-physical-science": "physics motion energy",
  "middle-religion-and-ethics": "mosque islamic architecture",
  "middle-science-and-engineering-practices": "engineering construction design",
  "middle-teacher-professional-development": "teacher training workshop",
  "middle-us-history": "american monument washington",
  "middle-world-history": "ancient civilization ruins",
  "middle-world-languages": "world language learning",

  // High (23)
  "high-arts": "fine art modern gallery",
  "high-business-and-economics": "business finance stock",
  "high-career-and-technical-education": "vocational training workshop",
  "high-chemistry": "chemistry lab beaker",
  "high-civics-and-government": "parliament law justice",
  "high-computer-science-and-technology": "coding software development",
  "high-earth-and-space-science": "satellite orbit astronomy",
  "high-english-language-arts": "literature poetry writing",
  "high-geography": "geography terrain topography",
  "high-health": "wellness medical healthcare",
  "high-life-sciences": "biology cells microscope",
  "high-life-skills": "leadership teamwork communication",
  "high-math": "calculus graph mathematics",
  "high-physical-education": "athletics competition training",
  "high-physics": "light energy motion physics",
  "high-psychology": "brain thinking mind psychology",
  "high-religion-and-philosophy": "philosophy temple meditation",
  "high-science-and-engineering-practices": "engineering robotics design",
  "high-sociology": "city crowd urban society",
  "high-teacher-professional-development": "education seminar professional",
  "high-us-history": "american history civil war",
  "high-world-history": "world history empire ancient",
  "high-world-languages": "multilingual translation culture",
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

async function searchPexelsVideos(
  query: string
): Promise<PexelsSearchResponse> {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10&size=small`

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
 * Pick the 2 best videos: shortest under 1200s (20 min), then smallest MP4 file.
 * Returns up to 2 distinct picks for variety per subject.
 */
function pickBestVideos(
  videos: PexelsVideo[],
  count: number = 2
): { video: PexelsVideo; file: PexelsVideoFile }[] {
  if (videos.length === 0) return []

  // Filter to videos under 20 minutes, sorted by duration ascending
  const eligible = videos
    .filter((v) => v.duration <= 1200)
    .sort((a, b) => a.duration - b.duration)

  const pool = eligible.length > 0 ? eligible : videos.slice(0, count)
  const picks: { video: PexelsVideo; file: PexelsVideoFile }[] = []

  for (const video of pool) {
    if (picks.length >= count) break

    // Pick smallest MP4 file
    const mp4Files = video.video_files
      .filter((f) => f.file_type === "video/mp4")
      .sort((a, b) => a.width - b.width)

    if (mp4Files.length > 0) {
      picks.push({ video, file: mp4Files[0] })
    }
  }

  return picks
}

/**
 * Download file from URL, following redirects
 */
function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    const protocol = url.startsWith("https") ? https : http

    const req = protocol
      .get(url, { timeout: 30000 }, (response) => {
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
      reject(new Error("Download timed out (30s)"))
    })
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🎬 Seed S3 Videos from Pexels")
  console.log("==============================\n")

  // --- Validate env ---
  if (!PEXELS_API_KEY) {
    console.error("❌ PEXELS_API_KEY not found in environment.\n")
    console.error("To get a free API key:")
    console.error("  1. Go to https://www.pexels.com/api → click 'Get Started'")
    console.error("  2. Sign up / log in → create a project → copy the API key")
    console.error("  3. Add PEXELS_API_KEY=your_key_here to .env\n")
    process.exit(1)
  }

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    console.error(
      "❌ AWS credentials missing. Need AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET in .env"
    )
    process.exit(1)
  }

  // --- Setup ---
  const s3 = getS3Client()
  const prisma = new PrismaClient()

  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true })
  }

  try {
    // 1. Fetch all catalog subjects to know which slugs exist
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

    console.log(`Found ${subjects.length} published subjects\n`)

    // 2. Download & upload 2 videos per subject
    const subjectVideoMap: Record<
      string,
      { cloudFrontUrl: string; s3Key: string; duration: number }[]
    > = {}

    let downloaded = 0
    let skipped = 0
    let failed = 0

    for (const subject of subjects) {
      const query = SUBJECT_VIDEO_QUERIES[subject.slug]
      if (!query) {
        // Skip subjects without a query (e.g. Sudanese base subjects)
        skipped++
        continue
      }

      console.log(`\n📹 ${subject.name} (${subject.slug})`)
      console.log(`   Query: "${query}"`)

      try {
        // Search Pexels
        const searchResult = await searchPexelsVideos(query)

        if (searchResult.videos.length === 0) {
          console.log(`   ⚠️  No Pexels results, skipping`)
          failed++
          await delay(API_DELAY_MS)
          continue
        }

        const picks = pickBestVideos(searchResult.videos, 2)
        if (picks.length === 0) {
          console.log(`   ⚠️  No suitable MP4 found, skipping`)
          failed++
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
          const suffix = i + 1 // 1-based: sample-chemistry-1.mp4, sample-chemistry-2.mp4
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
            console.log(`   ⏭️  Using cached download`)
          } else {
            console.log(`   ⬇️  Downloading...`)
            try {
              await downloadFile(pick.file.link, tmpFile)
            } catch {
              // Retry once
              console.log(`   ⚠️  Download failed, retrying...`)
              await delay(1000)
              try {
                await downloadFile(pick.file.link, tmpFile)
              } catch {
                console.log(
                  `   ❌ Download failed after retry, skipping video ${suffix}`
                )
                continue
              }
            }
          }

          // Upload to S3
          const fileBuffer = fs.readFileSync(tmpFile)
          console.log(
            `   ⬆️  Uploading to S3 (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)...`
          )

          await s3.send(
            new PutObjectCommand({
              Bucket: AWS_S3_BUCKET,
              Key: s3Key,
              Body: fileBuffer,
              ContentType: "video/mp4",
              CacheControl: "public, max-age=31536000, immutable",
            })
          )

          const cloudFrontUrl = getCloudFrontUrl(s3Key)
          entries.push({ cloudFrontUrl, s3Key, duration: pick.video.duration })
          console.log(`   ✅ Uploaded → ${cloudFrontUrl}`)
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

    console.log("\n==============================")
    console.log(`📊 Download Summary:`)
    console.log(`   Downloaded: ${downloaded}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Total subjects: ${subjects.length}`)

    if (downloaded === 0) {
      console.log("\n⚠️  No videos downloaded. Skipping DB updates.")
      return
    }

    // 3. Update LessonVideo records
    console.log("\n📝 Updating LessonVideo records...")

    // Get all platform-level YouTube videos with lesson/chapter ordering info
    const platformVideos = await prisma.lessonVideo.findMany({
      where: {
        provider: "youtube",
        schoolId: null,
      },
      select: {
        id: true,
        lesson: {
          select: {
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
        },
      },
    })

    console.log(`   Found ${platformVideos.length} platform YouTube videos`)

    let updated = 0
    let noMapping = 0

    // Group videos by subject slug, sorted by chapter then lesson sequence
    const videosBySlug: Record<
      string,
      { id: string; chapterOrder: number; lessonOrder: number }[]
    > = {}
    for (const video of platformVideos) {
      const slug = video.lesson.chapter.subject.slug
      if (!videosBySlug[slug]) videosBySlug[slug] = []
      videosBySlug[slug].push({
        id: video.id,
        chapterOrder: video.lesson.chapter.sequenceOrder,
        lessonOrder: video.lesson.sequenceOrder,
      })
    }

    // Sort each subject's videos by chapter order, then lesson order
    for (const vids of Object.values(videosBySlug)) {
      vids.sort(
        (a, b) =>
          a.chapterOrder - b.chapterOrder || a.lessonOrder - b.lessonOrder
      )
    }

    for (const [slug, videos] of Object.entries(videosBySlug)) {
      const entries = subjectVideoMap[slug]
      if (!entries) {
        noMapping += videos.length
        continue
      }

      // Only update first 2 lessons per subject (video 1 → lesson 1, video 2 → lesson 2)
      const toUpdate = videos.slice(0, entries.length)

      for (let i = 0; i < toUpdate.length; i++) {
        const entry = entries[i]
        await prisma.lessonVideo.update({
          where: { id: toUpdate[i].id },
          data: {
            videoUrl: entry.cloudFrontUrl,
            provider: "self-hosted",
            storageProvider: "aws_s3",
            storageKey: entry.s3Key,
            externalId: null,
            durationSeconds: entry.duration,
          },
        })
        updated++
      }

      console.log(
        `   ${slug}: ${toUpdate.length}/${videos.length} lessons updated`
      )
    }

    console.log(
      `\n✅ Done! Updated ${updated} lesson videos (first 2 per subject), ${noMapping} had no mapping`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
