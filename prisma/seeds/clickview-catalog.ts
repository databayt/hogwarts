/**
 * ClickView Catalog Seed
 *
 * Imports 62 US/ClickView subjects from master-inventory.json into the global catalog:
 *   62 CatalogSubjects → 201 CatalogChapters → 986 CatalogLessons
 *
 * Uses upsert with slug for idempotency. Updates denormalized counts.
 * Subject imageKey uses illustration cover images from complete-subjects.json.
 * Lesson imageKey uses high-res ?width=2048 URLs.
 *
 * Usage: pnpm db:seed:single clickview-catalog
 */

import fs from "fs"
import path from "path"
import type { PrismaClient, SchoolLevel } from "@prisma/client"

import { logSuccess } from "./utils"

// ============================================================================
// Types for master-inventory.json
// ============================================================================

interface ClickViewTopic {
  name: string
  slug: string
  imgSrc: string
  stats: string // "20 videos  • 9 resources"
}

interface ClickViewGroup {
  parent: string
  topics: ClickViewTopic[]
}

interface ClickViewEntry {
  subjectName: string
  level: "elementary" | "middle" | "high"
  url: string
  groups: ClickViewGroup[]
}

// ============================================================================
// Helpers
// ============================================================================

function levelToSchoolLevel(level: string): SchoolLevel {
  switch (level) {
    case "elementary":
      return "ELEMENTARY"
    case "middle":
      return "MIDDLE"
    case "high":
      return "HIGH"
    default:
      return "ELEMENTARY"
  }
}

function toSubjectSlug(level: string, name: string): string {
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
  return `${level}-${nameSlug}`
}

function toChapterSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

function parseStats(stats: string): {
  videoCount: number
  resourceCount: number
} {
  const videoMatch = stats.match(/(\d+)\s*videos?/i)
  const resourceMatch = stats.match(/(\d+)\s*resources?/i)
  return {
    videoCount: videoMatch ? parseInt(videoMatch[1], 10) : 0,
    resourceCount: resourceMatch ? parseInt(resourceMatch[1], 10) : 0,
  }
}

function extractClickViewId(url: string | undefined): string | null {
  if (!url) return null
  // Extract ID from URL like /us/elementary/topics/GxAzY0z/arts
  const match = url.match(/\/topics\/([^/]+)\//)
  return match ? match[1] : null
}

function extractCoverId(imgSrc: string): string | null {
  // Extract cover ID from URL like https://img.clickviewapp.com/v2/covers/0wrjm3?size=medium
  const match = imgSrc.match(/\/covers\/([^?/]+)/)
  return match ? match[1] : null
}

/** Convert "rgb(R, G, B)" → "#rrggbb" */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/)
  if (!match) return null
  const [, r, g, b] = match.map(Number)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// Fallback colors when scraped bgColor is unavailable
const FALLBACK_COLORS: Record<string, string> = {
  Arts: "#f43f5e",
  "Celebrations, Commemorations and Festivals": "#eab308",
  "Civics and Government": "#ec4899",
  "Computer Science and Technology": "#6366f1",
  "Earth and Space Science": "#0ea5e9",
  Economics: "#f97316",
  "English Language Arts": "#3b82f6",
  Geography: "#14b8a6",
  Health: "#10b981",
  History: "#f59e0b",
  Languages: "#8b5cf6",
  "Life Science": "#059669",
  "Life Skills": "#a855f7",
  Math: "#3b82f6",
  "Physical Education": "#22c55e",
  "Physical Science": "#ef4444",
  Religion: "#059669",
  Science: "#10b981",
  "Social Studies": "#8b5cf6",
  "Teacher Professional Development": "#6366f1",
  "World Languages": "#a855f7",
  "Business and Economics": "#f97316",
  "Career and Technical Education": "#0ea5e9",
  Chemistry: "#ef4444",
  "Chemical Science": "#ef4444",
  "Science and Engineering Practices": "#14b8a6",
  "U.S. History": "#e3714c",
  "World History": "#eab308",
  "Religion and Ethics": "#059669",
  Psychology: "#a855f7",
  Sociology: "#ec4899",
  "Music Composition": "#d946ef",
  Physics: "#f59e0b",
  Biology: "#6366f1",
  "Careers and Technical Education": "#0ea5e9",
  "Life Sciences": "#059669",
  "Religion and Philosophy": "#059669",
}

// ============================================================================
// Main seed function
// ============================================================================

export async function seedClickViewCatalog(
  prisma: PrismaClient
): Promise<void> {
  const inventoryPath = path.resolve(
    __dirname,
    "../../scripts/clickview-data/master-inventory.json"
  )

  if (!fs.existsSync(inventoryPath)) {
    console.log("  master-inventory.json not found, skipping ClickView seed")
    return
  }

  const raw = fs.readFileSync(inventoryPath, "utf-8")
  const entries: ClickViewEntry[] = JSON.parse(raw)

  // Load scraped subject data for illustration images and accurate colors
  const completeSubjectsPath = path.resolve(
    __dirname,
    "../../scripts/clickview-data/complete-subjects.json"
  )
  let scrapedLookup: Record<string, { coverUrl: string; bgColor: string }> = {}
  if (fs.existsSync(completeSubjectsPath)) {
    const scraped = JSON.parse(fs.readFileSync(completeSubjectsPath, "utf-8"))
    for (const level of ["elementary", "middle", "high"]) {
      for (const sub of scraped[level] ?? []) {
        const key = `${level}-${sub.slug}`
        scrapedLookup[key] = {
          coverUrl: sub.coverUrl,
          bgColor: sub.bgColor,
        }

        // Also index by seed-generated slug (handles "U.S. History" → "us-history" vs "u-s-history")
        const seedKey = toSubjectSlug(level, sub.name)
        if (seedKey !== key) {
          scrapedLookup[seedKey] = {
            coverUrl: sub.coverUrl,
            bgColor: sub.bgColor,
          }
        }
      }
    }
  }

  let subjectCount = 0
  let chapterCount = 0
  let lessonCount = 0

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const slug = toSubjectSlug(entry.level, entry.subjectName)
    const schoolLevel = levelToSchoolLevel(entry.level)
    const clickviewId = extractClickViewId(entry.url)

    // Use illustration image if available locally, else fall back to cover URL or first topic
    const illustrationFile = `clickview/illustrations/${slug}.jpg`
    const illustrationAbsPath = path.join(
      __dirname,
      "../../public",
      illustrationFile
    )
    const illustrationExists = fs.existsSync(illustrationAbsPath)
    const scraped = scrapedLookup[slug]

    // Prefer scraped ClickView RGB color, fall back to hardcoded
    const scrapedHex = scraped?.bgColor ? rgbToHex(scraped.bgColor) : null
    const color = scrapedHex ?? FALLBACK_COLORS[entry.subjectName] ?? "#6366f1"

    const imageKey = illustrationExists
      ? `/${illustrationFile}`
      : (scraped?.coverUrl ?? entry.groups[0]?.topics[0]?.imgSrc ?? null)

    // Create/update CatalogSubject
    const subject = await prisma.catalogSubject.upsert({
      where: { slug },
      update: {
        name: entry.subjectName,
        levels: [schoolLevel],
        clickviewId,
        clickviewUrl: entry.url
          ? `https://www.clickview.net${entry.url}`
          : null,
        color,
        imageKey,
        sortOrder: 100 + i, // Offset from Sudanese subjects
      },
      create: {
        name: entry.subjectName,
        slug,
        lang: "en",
        department: entry.subjectName,
        levels: [schoolLevel],
        country: "US",
        system: "clickview",
        clickviewId,
        clickviewUrl: entry.url
          ? `https://www.clickview.net${entry.url}`
          : null,
        color,
        imageKey,
        sortOrder: 100 + i,
        status: "PUBLISHED",
      },
    })
    subjectCount++

    // Create CatalogChapters (groups)
    for (let g = 0; g < entry.groups.length; g++) {
      const group = entry.groups[g]
      const chapterSlug = toChapterSlug(group.parent)

      const chapter = await prisma.catalogChapter.upsert({
        where: {
          subjectId_slug: {
            subjectId: subject.id,
            slug: chapterSlug,
          },
        },
        update: {
          name: group.parent,
          sequenceOrder: g + 1,
          color,
        },
        create: {
          subjectId: subject.id,
          name: group.parent,
          slug: chapterSlug,
          lang: "en",
          sequenceOrder: g + 1,
          color,
          levels: [schoolLevel],
          status: "PUBLISHED",
        },
      })
      chapterCount++

      // Create CatalogLessons (topics)
      for (let t = 0; t < group.topics.length; t++) {
        const topic = group.topics[t]
        const { videoCount, resourceCount } = parseStats(topic.stats)
        const coverId = extractCoverId(topic.imgSrc)
        // Store high-res cover URL as lesson imageKey
        const lessonImageKey = topic.imgSrc || null

        await prisma.catalogLesson.upsert({
          where: {
            chapterId_slug: {
              chapterId: chapter.id,
              slug: topic.slug,
            },
          },
          update: {
            name: topic.name,
            sequenceOrder: t + 1,
            clickviewCoverId: coverId,
            imageKey: lessonImageKey,
            videoCount,
            resourceCount,
            color,
          },
          create: {
            chapterId: chapter.id,
            name: topic.name,
            slug: topic.slug,
            lang: "en",
            sequenceOrder: t + 1,
            clickviewCoverId: coverId,
            imageKey: lessonImageKey,
            videoCount,
            resourceCount,
            color,
            levels: [schoolLevel],
            status: "PUBLISHED",
          },
        })
        lessonCount++
      }
    }
  }

  logSuccess("ClickView CatalogSubjects", subjectCount, "US curriculum")
  logSuccess("ClickView CatalogChapters", chapterCount, "US curriculum")
  logSuccess("ClickView CatalogLessons", lessonCount, "US curriculum")

  // Update denormalized counts
  console.log("  Updating denormalized counts...")

  const allSubjects = await prisma.catalogSubject.findMany({
    where: { system: "clickview" },
    select: { id: true },
  })

  for (const s of allSubjects) {
    const chapters = await prisma.catalogChapter.findMany({
      where: { subjectId: s.id },
      select: { id: true },
    })

    const totalLessons = await prisma.catalogLesson.count({
      where: { chapter: { subjectId: s.id } },
    })

    await prisma.catalogSubject.update({
      where: { id: s.id },
      data: {
        totalChapters: chapters.length,
        totalLessons,
        totalContent: totalLessons,
      },
    })

    for (const ch of chapters) {
      const count = await prisma.catalogLesson.count({
        where: { chapterId: ch.id },
      })
      await prisma.catalogChapter.update({
        where: { id: ch.id },
        data: { totalLessons: count, totalContent: count },
      })
    }
  }

  console.log("  Denormalized counts updated.")
}
