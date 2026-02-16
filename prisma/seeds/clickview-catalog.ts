/**
 * ClickView Catalog Seed
 *
 * Imports 62 US/ClickView subjects from master-inventory.json into the global catalog:
 *   62 CatalogSubjects → 201 CatalogChapters → 986 CatalogLessons
 *
 * Uses upsert with slug for idempotency. Updates denormalized counts.
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

function extractClickViewId(url: string): string | null {
  // Extract ID from URL like /us/elementary/topics/GxAzY0z/arts
  const match = url.match(/\/topics\/([^/]+)\//)
  return match ? match[1] : null
}

function extractCoverId(imgSrc: string): string | null {
  // Extract cover ID from URL like https://img.clickviewapp.com/v2/covers/0wrjm3?size=medium
  const match = imgSrc.match(/\/covers\/([^?/]+)/)
  return match ? match[1] : null
}

// Vibrant colors for departments
const DEPARTMENT_COLORS: Record<string, string> = {
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
  "U.S. History": "#dc2626",
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

  let subjectCount = 0
  let chapterCount = 0
  let lessonCount = 0

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const slug = toSubjectSlug(entry.level, entry.subjectName)
    const schoolLevel = levelToSchoolLevel(entry.level)
    const clickviewId = extractClickViewId(entry.url)
    const color = DEPARTMENT_COLORS[entry.subjectName] ?? "#6366f1"

    // Create/update CatalogSubject
    const subject = await prisma.catalogSubject.upsert({
      where: { slug },
      update: {
        name: entry.subjectName,
        levels: [schoolLevel],
        clickviewId,
        clickviewUrl: `https://clickview.com${entry.url}`,
        color,
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
        clickviewUrl: `https://clickview.com${entry.url}`,
        color,
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
