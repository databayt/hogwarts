/**
 * Catalog Seed
 *
 * Transforms existing SUBJECTS + ALL_TOPICS into global catalog models:
 *   CatalogSubject → CatalogChapter → CatalogLesson
 *
 * Then creates SchoolSubjectSelection bridge records for the demo school.
 */

import type { PrismaClient } from "@prisma/client"

import { SUBJECTS } from "./constants"
import { ALL_TOPICS } from "./topic-constants"
import type { CatalogSubjectRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// Slug generation from Arabic name
// ============================================================================

const ARABIC_TO_SLUG: Record<string, string> = {
  "اللغة العربية": "arabic",
  "اللغة الإنجليزية": "english",
  "اللغة الفرنسية": "french",
  الرياضيات: "mathematics",
  العلوم: "science",
  الفيزياء: "physics",
  الكيمياء: "chemistry",
  الأحياء: "biology",
  "علوم الأرض والفضاء": "earth-space-sciences",
  "علوم الحاسوب": "computer-science",
  "العلوم والهندسة": "science-engineering",
  التاريخ: "history",
  "تاريخ السودان": "sudan-history",
  "تاريخ العالم": "world-history",
  الجغرافيا: "geography",
  "الدراسات الاجتماعية": "social-studies",
  "التربية الوطنية": "civics-citizenship",
  "الاقتصاد والأعمال": "business-economics",
  "علم النفس": "psychology",
  "التربية الإسلامية": "islamic-education",
  "القرآن الكريم": "quran",
  الحاسوب: "ict",
  "التربية الفنية": "the-arts",
  الموسيقى: "music",
  "التربية البدنية": "physical-education",
  الصحة: "health",
  "المهارات الحياتية": "life-skills",
  "التعليم المهني": "career-education",
  "الاحتفالات والمناسبات": "celebrations",
  "التطوير المهني": "teacher-development",
  "اللغات العالمية": "world-languages",
  "علم الاجتماع": "sociology",
  "التاريخ الأمريكي": "us-history",
}

function toSlug(name: string): string {
  return ARABIC_TO_SLUG[name] ?? name.toLowerCase().replace(/\s+/g, "-")
}

// Map from levels array strings to SchoolLevel enum values
function toLevels(levels: string[]): ("ELEMENTARY" | "MIDDLE" | "HIGH")[] {
  const result = new Set<"ELEMENTARY" | "MIDDLE" | "HIGH">()
  for (const level of levels) {
    switch (level) {
      case "all":
        result.add("ELEMENTARY")
        result.add("MIDDLE")
        result.add("HIGH")
        break
      case "KG-6":
      case "1-6":
        result.add("ELEMENTARY")
        break
      case "7-12":
        result.add("MIDDLE")
        result.add("HIGH")
        break
      case "KG-9":
        result.add("ELEMENTARY")
        result.add("MIDDLE")
        break
      case "3-12":
      case "4-12":
        result.add("ELEMENTARY")
        result.add("MIDDLE")
        result.add("HIGH")
        break
      case "elementary":
        result.add("ELEMENTARY")
        break
      case "middle":
        result.add("MIDDLE")
        break
      case "high":
        result.add("HIGH")
        break
    }
  }
  return Array.from(result)
}

// Department Arabic → English slug for grouping
const DEPT_MAP: Record<string, string> = {
  اللغات: "languages",
  العلوم: "sciences",
  "العلوم الإنسانية": "humanities",
  الدين: "religion",
  "تقنية المعلومات": "ict",
  "الفنون والرياضة": "arts-pe",
}

// Subject slug → vibrant hex color (derived from ClickView cover art)
const SUBJECT_COLORS: Record<string, string> = {
  // Languages
  arabic: "#3b82f6", // blue
  english: "#ec4899", // pink
  french: "#8b5cf6", // violet
  "world-languages": "#a855f7", // purple

  // Sciences
  mathematics: "#3b82f6", // blue
  science: "#10b981", // emerald
  physics: "#f59e0b", // amber
  chemistry: "#ef4444", // red
  biology: "#6366f1", // indigo
  "earth-space-sciences": "#0ea5e9", // sky blue
  "computer-science": "#6366f1", // indigo
  "science-engineering": "#14b8a6", // teal

  // Humanities
  history: "#f59e0b", // amber
  "sudan-history": "#f59e0b", // amber
  "world-history": "#eab308", // yellow
  "us-history": "#dc2626", // red
  geography: "#14b8a6", // teal
  "social-studies": "#8b5cf6", // violet
  "civics-citizenship": "#ec4899", // pink
  "business-economics": "#f97316", // orange
  psychology: "#a855f7", // purple
  sociology: "#ec4899", // pink

  // Religion
  "islamic-education": "#059669", // emerald
  quran: "#059669", // emerald

  // ICT
  ict: "#06b6d4", // cyan

  // Arts & PE
  "the-arts": "#f43f5e", // rose
  music: "#d946ef", // fuchsia
  "physical-education": "#22c55e", // green
  health: "#10b981", // emerald
  "life-skills": "#8b5cf6", // violet
  "career-education": "#0ea5e9", // sky blue
  celebrations: "#eab308", // yellow
  "teacher-development": "#6366f1", // indigo
}

// Subject slug → ClickView banner image path
const BANNER_MAP: Record<string, string> = {
  arabic: "/clickview/banners/elementary-english-language-arts.jpg",
  english: "/clickview/banners/high-english-language-arts.jpg",
  french: "/clickview/banners/high-languages.jpg",
  mathematics: "/clickview/banners/elementary-math.jpg",
  science: "/clickview/banners/elementary-science.jpg",
  physics: "/clickview/banners/high-physics.jpg",
  chemistry: "/clickview/banners/high-chemistry.jpg",
  biology: "/clickview/banners/high-life-science.jpg",
  "earth-space-sciences": "/clickview/banners/high-earth-and-space-science.jpg",
  "computer-science":
    "/clickview/banners/high-computer-science-and-technology.jpg",
  "science-engineering":
    "/clickview/banners/high-science-and-engineering-practices.jpg",
  history: "/clickview/banners/high-history.jpg",
  "sudan-history": "/clickview/banners/high-history.jpg",
  "world-history": "/clickview/banners/high-history.jpg",
  geography: "/clickview/banners/high-geography.jpg",
  "social-studies": "/clickview/banners/high-civics-and-government.jpg",
  "civics-citizenship": "/clickview/banners/high-civics-and-government.jpg",
  "business-economics": "/clickview/banners/high-business-and-economics.jpg",
  psychology: "/clickview/banners/high-health.jpg",
  "islamic-education": "/clickview/banners/high-religion.jpg",
  quran: "/clickview/banners/high-religion.jpg",
  ict: "/clickview/banners/high-computer-science-and-technology.jpg",
  "the-arts": "/clickview/banners/elementary-arts.jpg",
  music: "/clickview/banners/high-arts.jpg",
  "physical-education": "/clickview/banners/high-physical-education.jpg",
  health: "/clickview/banners/high-health.jpg",
  "life-skills": "/clickview/banners/high-career-and-technical-education.jpg",
  "career-education":
    "/clickview/banners/high-career-and-technical-education.jpg",
  celebrations:
    "/clickview/banners/high-celebrations-commemorations-and-festivals.jpg",
  "teacher-development":
    "/clickview/banners/high-teacher-professional-development.jpg",
  "world-languages": "/clickview/banners/high-languages.jpg",
  sociology: "/clickview/banners/high-health.jpg",
  "us-history": "/clickview/banners/high-history.jpg",
}

// ============================================================================
// Main seed function
// ============================================================================

export async function seedCatalog(
  prisma: PrismaClient
): Promise<CatalogSubjectRef[]> {
  const catalogSubjects: CatalogSubjectRef[] = []

  // ======================================================================
  // Step 1: Create CatalogSubjects from SUBJECTS constant
  // ======================================================================

  for (let i = 0; i < SUBJECTS.length; i++) {
    const s = SUBJECTS[i]
    const slug = toSlug(s.name)
    const levels = toLevels(s.levels)

    const bannerImage = BANNER_MAP[slug] ?? null

    const subject = await prisma.catalogSubject.upsert({
      where: { slug },
      update: {
        name: s.name,
        department: s.department,
        levels,
        description: s.description,
        imageKey: bannerImage ?? s.imageKey ?? null,
        color: SUBJECT_COLORS[slug] ?? s.color ?? null,
        sortOrder: i,
        status: "PUBLISHED",
      },
      create: {
        name: s.name,
        slug,
        lang: "ar",
        department: s.department,
        levels,
        description: s.description,
        country: "SD",
        system: "national",
        imageKey: bannerImage ?? s.imageKey ?? null,
        color: SUBJECT_COLORS[slug] ?? s.color ?? null,
        sortOrder: i,
        status: "PUBLISHED",
      },
    })

    catalogSubjects.push({
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
    })
  }

  logSuccess("CatalogSubjects", catalogSubjects.length, "global catalog")

  // Update banners for any pre-existing subjects not in SUBJECTS constant
  for (const [slug, bannerPath] of Object.entries(BANNER_MAP)) {
    await prisma.catalogSubject.updateMany({
      where: { slug, imageKey: { not: bannerPath } },
      data: { imageKey: bannerPath },
    })
  }

  // ======================================================================
  // Step 2: Create CatalogChapters + CatalogLessons from ALL_TOPICS
  // ======================================================================

  // Build subject name → CatalogSubject map
  const subjectMap = new Map(catalogSubjects.map((s) => [s.name, s]))

  // Separate top-level (chapters) and sub-topics (lessons)
  const topLevel = ALL_TOPICS.filter((t) => !t.parentName)
  const subTopics = ALL_TOPICS.filter((t) => !!t.parentName)

  // Pass 1: Create CatalogChapters (top-level topics)
  const chapterMap = new Map<string, string>() // "subjectName::topicName" → chapterId
  let chapterCount = 0

  for (const td of topLevel) {
    const catalogSubject = subjectMap.get(td.subjectName)
    if (!catalogSubject) continue

    const chapter = await prisma.catalogChapter.upsert({
      where: {
        subjectId_slug: {
          subjectId: catalogSubject.id,
          slug: td.slug,
        },
      },
      update: {
        name: td.name,
        sequenceOrder: td.sequenceOrder,
        imageKey: td.imageKey ?? null,
        color: td.color ?? null,
      },
      create: {
        subjectId: catalogSubject.id,
        name: td.name,
        slug: td.slug,
        lang: td.lang ?? "ar",
        description: td.description ?? null,
        sequenceOrder: td.sequenceOrder,
        imageKey: td.imageKey ?? null,
        color: td.color ?? null,
        status: "PUBLISHED",
      },
    })

    chapterMap.set(`${td.subjectName}::${td.name}`, chapter.id)
    chapterCount++
  }

  logSuccess("CatalogChapters", chapterCount, "global catalog")

  // Pass 2: Create CatalogLessons (sub-topics)
  let lessonCount = 0

  for (const td of subTopics) {
    const catalogSubject = subjectMap.get(td.subjectName)
    if (!catalogSubject) continue

    const parentKey = `${td.subjectName}::${td.parentName}`
    const chapterId = chapterMap.get(parentKey)
    if (!chapterId) continue

    await prisma.catalogLesson.upsert({
      where: {
        chapterId_slug: {
          chapterId,
          slug: td.slug,
        },
      },
      update: {
        name: td.name,
        sequenceOrder: td.sequenceOrder,
        imageKey: td.imageKey ?? null,
        color: td.color ?? null,
      },
      create: {
        chapterId,
        name: td.name,
        slug: td.slug,
        lang: td.lang ?? "ar",
        description: td.description ?? null,
        sequenceOrder: td.sequenceOrder,
        imageKey: td.imageKey ?? null,
        color: td.color ?? null,
        status: "PUBLISHED",
      },
    })

    lessonCount++
  }

  logSuccess("CatalogLessons", lessonCount, "global catalog")

  // ======================================================================
  // Step 3: Update denormalized counts
  // ======================================================================

  for (const cs of catalogSubjects) {
    const chapters = await prisma.catalogChapter.findMany({
      where: { subjectId: cs.id },
      select: { id: true },
    })

    const totalLessons = await prisma.catalogLesson.count({
      where: { chapter: { subjectId: cs.id } },
    })

    await prisma.catalogSubject.update({
      where: { id: cs.id },
      data: {
        totalChapters: chapters.length,
        totalLessons,
      },
    })

    // Update chapter lesson counts
    for (const ch of chapters) {
      const count = await prisma.catalogLesson.count({
        where: { chapterId: ch.id },
      })
      await prisma.catalogChapter.update({
        where: { id: ch.id },
        data: { totalLessons: count },
      })
    }
  }

  return catalogSubjects
}
