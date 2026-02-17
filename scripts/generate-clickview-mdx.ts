/**
 * Generate ClickView Content Library MDX documentation.
 *
 * Produces 4 files:
 *   - clickview.mdx          (overview + quick reference)
 *   - clickview-elementary.mdx (18 subjects)
 *   - clickview-middle.mdx     (21 subjects)
 *   - clickview-high.mdx       (23 subjects)
 *
 * Usage: npx tsx scripts/generate-clickview-mdx.ts
 */

import fs from "fs"
import path from "path"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Topic {
  name: string
  slug: string
  imgSrc: string
  stats: string
}

interface Group {
  parent: string
  topics: Topic[]
}

interface InventoryEntry {
  subjectName: string
  level: "elementary" | "middle" | "high"
  url: string
  groups: Group[]
}

interface BannerEntry {
  arabicName: string
  englishName: string
  bannerId: string
  url: string
  downloaded: boolean
}

type BannerMetadata = Record<string, Record<string, BannerEntry>>

// ---------------------------------------------------------------------------
// Data: SUBJECT_COLORS (from prisma/seeds/catalog.ts)
// ---------------------------------------------------------------------------

const SUBJECT_COLORS: Record<string, string> = {
  arabic: "#3b82f6",
  english: "#ec4899",
  french: "#8b5cf6",
  "world-languages": "#a855f7",
  mathematics: "#3b82f6",
  science: "#10b981",
  physics: "#f59e0b",
  chemistry: "#ef4444",
  biology: "#6366f1",
  "earth-space-sciences": "#0ea5e9",
  "computer-science": "#6366f1",
  "science-engineering": "#14b8a6",
  history: "#f59e0b",
  "sudan-history": "#f59e0b",
  "world-history": "#eab308",
  "us-history": "#dc2626",
  geography: "#14b8a6",
  "social-studies": "#8b5cf6",
  "civics-citizenship": "#ec4899",
  "business-economics": "#f97316",
  psychology: "#a855f7",
  sociology: "#ec4899",
  "islamic-education": "#059669",
  quran: "#059669",
  ict: "#06b6d4",
  "the-arts": "#f43f5e",
  music: "#d946ef",
  "physical-education": "#22c55e",
  health: "#10b981",
  "life-skills": "#8b5cf6",
  "career-education": "#0ea5e9",
  celebrations: "#eab308",
  "teacher-development": "#6366f1",
}

const NAME_TO_SLUG: Record<string, string> = {
  Arts: "the-arts",
  "English Language Arts": "english",
  Math: "mathematics",
  Science: "science",
  "Social Studies": "social-studies",
  "Business and Economics": "business-economics",
  "Career and Technical Education": "career-education",
  "Celebrations, Commemorations & Festivals": "celebrations",
  Chemistry: "chemistry",
  "Civics and Government": "civics-citizenship",
  "Computer Science and Technology": "computer-science",
  "Earth and Space Science": "earth-space-sciences",
  Geography: "geography",
  Health: "health",
  History: "history",
  Languages: "world-languages",
  "Life Science": "biology",
  "Physical Education": "physical-education",
  Physics: "physics",
  Religion: "islamic-education",
  "Science and Engineering Practices": "science-engineering",
  "Teacher Professional Development": "teacher-development",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseStats(stats: string): { videos: number; resources: number } {
  const m = stats.match(/(\d+)\s*videos?\s*.*?(\d+)\s*resources?/i)
  return m
    ? { videos: parseInt(m[1]), resources: parseInt(m[2]) }
    : { videos: 0, resources: 0 }
}

function extractCoverId(imgSrc: string): string {
  const m = imgSrc.match(/covers\/([^?/]+)/)
  return m ? m[1] : "-"
}

function getColor(subjectName: string): string {
  const slug =
    NAME_TO_SLUG[subjectName] ?? subjectName.toLowerCase().replace(/\s+/g, "-")
  return SUBJECT_COLORS[slug] ?? "#64748b"
}

function getSlug(subjectName: string): string {
  return (
    NAME_TO_SLUG[subjectName] ?? subjectName.toLowerCase().replace(/\s+/g, "-")
  )
}

function levelLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function levelStats(entries: InventoryEntry[]) {
  let groups = 0,
    topics = 0,
    videos = 0,
    resources = 0
  for (const e of entries) {
    for (const g of e.groups) {
      groups++
      for (const t of g.topics) {
        topics++
        const s = parseStats(t.stats)
        videos += s.videos
        resources += s.resources
      }
    }
  }
  return { subjects: entries.length, groups, topics, videos, resources }
}

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..")
const DOCS = path.join(ROOT, "content/docs-en")

const inventory: InventoryEntry[] = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "scripts/clickview-data/master-inventory.json"),
    "utf-8"
  )
)
const bannerMeta: BannerMetadata = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "scripts/clickview-data/banner-metadata.json"),
    "utf-8"
  )
)

const bannerLookup = new Map<string, string>()
for (const [level, subjects] of Object.entries(bannerMeta)) {
  for (const entry of Object.values(subjects)) {
    bannerLookup.set(`${level}/${entry.englishName}`, entry.bannerId)
  }
}

const levelOrder = { elementary: 0, middle: 1, high: 2 }
const sorted = [...inventory].sort(
  (a, b) =>
    levelOrder[a.level] - levelOrder[b.level] ||
    a.subjectName.localeCompare(b.subjectName)
)

const byLevel = new Map<string, InventoryEntry[]>()
for (const entry of sorted) {
  const list = byLevel.get(entry.level) ?? []
  list.push(entry)
  byLevel.set(entry.level, list)
}

// Aggregate stats
let totalSubjects = 0,
  totalGroups = 0,
  totalTopics = 0,
  totalVideos = 0,
  totalResources = 0
for (const entry of inventory) {
  totalSubjects++
  for (const g of entry.groups) {
    totalGroups++
    for (const t of g.topics) {
      totalTopics++
      const s = parseStats(t.stats)
      totalVideos += s.videos
      totalResources += s.resources
    }
  }
}

// ---------------------------------------------------------------------------
// File 1: clickview.mdx (overview + quick reference)
// ---------------------------------------------------------------------------

function generateIndex(): string {
  const lines: string[] = []
  const w = (line = "") => lines.push(line)

  w("---")
  w("title: ClickView Content Library")
  w(
    "description: Complete inventory of 62 subjects, 201 topic groups, and 986 sub-topics from the ClickView educational content library."
  )
  w("---")
  w()
  w("# ClickView Content Library")
  w()
  w(
    "Complete structural reference for all ClickView content mapped to the Hogwarts catalog system. This document covers **62 subjects** across three school levels with full topic breakdowns."
  )
  w()
  w("## Overview")
  w()
  w("| Metric | Count |")
  w("| --- | --- |")
  w(`| Subjects | ${totalSubjects.toLocaleString()} |`)
  w(`| Topic Groups | ${totalGroups.toLocaleString()} |`)
  w(`| Sub-Topics | ${totalTopics.toLocaleString()} |`)
  w(`| Videos | ${totalVideos.toLocaleString()} |`)
  w(`| Resources | ${totalResources.toLocaleString()} |`)
  w()

  w("### By Level")
  w()
  w("| Level | Subjects | Groups | Topics | Videos | Resources | Details |")
  w("| --- | --- | --- | --- | --- | --- | --- |")
  for (const level of ["elementary", "middle", "high"] as const) {
    const entries = byLevel.get(level) ?? []
    const s = levelStats(entries)
    w(
      `| ${levelLabel(level)} | ${s.subjects} | ${s.groups} | ${s.topics} | ${s.videos.toLocaleString()} | ${s.resources.toLocaleString()} | [View](/docs/clickview-${level}) |`
    )
  }
  w()

  w("## Quick Reference")
  w()
  w("All 62 subjects in one table:")
  w()
  w("| Level | Subject | Slug | Color | Groups | Topics |")
  w("| --- | --- | --- | --- | --- | --- |")
  for (const entry of sorted) {
    const slug = getSlug(entry.subjectName)
    const color = getColor(entry.subjectName)
    const groupCount = entry.groups.length
    const topicCount = entry.groups.reduce((sum, g) => sum + g.topics.length, 0)
    w(
      `| ${levelLabel(entry.level)} | ${entry.subjectName} | \`${slug}\` | \`${color}\` | ${groupCount} | ${topicCount} |`
    )
  }
  w()
  w("---")
  w()
  w(
    `*Generated on ${new Date().toISOString().split("T")[0]} from \`scripts/clickview-data/master-inventory.json\`.*`
  )
  w()
  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// File 2-4: clickview-{level}.mdx (detailed per-level)
// ---------------------------------------------------------------------------

function generateLevel(level: "elementary" | "middle" | "high"): string {
  const entries = byLevel.get(level) ?? []
  const s = levelStats(entries)
  const lines: string[] = []
  const w = (line = "") => lines.push(line)

  w("---")
  w(`title: ClickView ${levelLabel(level)}`)
  w(
    `description: ${s.subjects} subjects, ${s.groups} topic groups, and ${s.topics} sub-topics in the ClickView ${levelLabel(level)} content library.`
  )
  w("---")
  w()
  w(`# ClickView ${levelLabel(level)}`)
  w()
  w(
    `${entries.length} subjects | ${s.groups} groups | ${s.topics} topics | ${s.videos.toLocaleString()} videos | ${s.resources.toLocaleString()} resources`
  )
  w()

  for (const entry of entries) {
    const slug = getSlug(entry.subjectName)
    const color = getColor(entry.subjectName)
    const bannerId = bannerLookup.get(`${level}/${entry.subjectName}`) ?? "-"
    const fullUrl = `https://www.clickview.net${entry.url}`
    const topicCount = entry.groups.reduce((sum, g) => sum + g.topics.length, 0)
    const groupCount = entry.groups.length

    let subjectVideos = 0,
      subjectResources = 0
    for (const g of entry.groups) {
      for (const t of g.topics) {
        const st = parseStats(t.stats)
        subjectVideos += st.videos
        subjectResources += st.resources
      }
    }

    w(`## ${entry.subjectName}`)
    w()
    w(`> **URL:** ${fullUrl}`)
    w(
      `> **Banner ID:** \`${bannerId}\` | **Slug:** \`${slug}\` | **Color:** \`${color}\``
    )
    w(
      `> **Content:** ${groupCount} groups | ${topicCount} topics | ${subjectVideos.toLocaleString()} videos | ${subjectResources.toLocaleString()} resources`
    )
    w()

    for (const group of entry.groups) {
      w(`### ${group.parent}`)
      w()
      w("| Sub-Topic | Slug | Videos | Resources | Cover ID |")
      w("| --- | --- | --- | --- | --- |")
      for (const t of group.topics) {
        const st = parseStats(t.stats)
        const coverId = extractCoverId(t.imgSrc)
        w(
          `| ${t.name} | \`${t.slug}\` | ${st.videos} | ${st.resources} | \`${coverId}\` |`
        )
      }
      w()
    }
  }

  w("---")
  w()
  w(
    `*Generated on ${new Date().toISOString().split("T")[0]} from \`scripts/clickview-data/master-inventory.json\`.*`
  )
  w()
  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Write all files
// ---------------------------------------------------------------------------

const files = [
  { name: "clickview.mdx", content: generateIndex() },
  { name: "clickview-elementary.mdx", content: generateLevel("elementary") },
  { name: "clickview-middle.mdx", content: generateLevel("middle") },
  { name: "clickview-high.mdx", content: generateLevel("high") },
]

for (const f of files) {
  const outPath = path.join(DOCS, f.name)
  fs.writeFileSync(outPath, f.content, "utf-8")
  const lineCount = f.content.split("\n").length
  console.log(`${f.name}: ${lineCount} lines`)
}
